import { NextRequest, NextResponse } from 'next/server'
import { Preference } from 'mercadopago'

import { getMercadoPagoConfig } from '@/lib/mercadopago/client'

export const runtime = 'nodejs'

/**
 * Gera uma preferência do Mercado Pago Checkout Pro para um pedido já
 * criado no Supabase.
 *
 * IMPORTANTE (segurança):
 * - O pedido já foi gravado pela RPC `create_order` (SECURITY DEFINER), que
 *   recalcula preços com os valores do banco e dá baixa de estoque. Portanto
 *   o valor autoritativo é `total`, vindo do resultado dessa RPC.
 * - Este endpoint monta os itens reais para exibição no checkout e, ao final,
 *   FORÇA o total da preferência a bater exatamente com o `total` do pedido
 *   por meio de uma linha de ajuste. Assim, mesmo que o cliente adultere os
 *   preços unitários enviados, o valor cobrado nunca diverge do servidor.
 * - O Access Token nunca sai do servidor (ver lib/mercadopago/client.ts).
 */

type IncomingItem = {
  title?: unknown
  quantity?: unknown
  unit_price?: unknown
}

type Body = {
  orderId?: unknown
  orderNumber?: unknown
  total?: unknown
  discount?: unknown
  shipping?: unknown
  giftFee?: unknown
  items?: unknown
  payer?: {
    name?: unknown
    email?: unknown
    phone?: unknown
  }
}

function toMoney(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return 0
  // Duas casas decimais, evitando ruído de ponto flutuante.
  return Math.round(n * 100) / 100
}

export async function POST(request: NextRequest) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Corpo inválido.' }, { status: 400 })
  }

  const orderId = String(body.orderId ?? '').trim()
  const orderNumber = String(body.orderNumber ?? '').trim()
  const total = toMoney(body.total)

  if (!orderId || !orderNumber) {
    return NextResponse.json(
      { error: 'Pedido inválido para pagamento.' },
      { status: 400 },
    )
  }
  if (total <= 0) {
    return NextResponse.json(
      { error: 'Total do pedido inválido.' },
      { status: 400 },
    )
  }

  // Base para as back_urls e notification: usa a origem da requisição, então
  // funciona automaticamente em Preview e em Produção sem configuração extra.
  const origin =
    request.headers.get('origin') ?? request.nextUrl.origin ?? ''

  // ---- Monta os itens reais do carrinho (apenas exibição no checkout) ----
  const rawItems = Array.isArray(body.items) ? (body.items as IncomingItem[]) : []
  const displayItems = rawItems
    .map((it, index) => {
      const title = String(it.title ?? '').trim() || `Item ${index + 1}`
      const quantity = Math.max(1, Math.floor(Number(it.quantity) || 1))
      const unitPrice = toMoney(it.unit_price)
      return { title, quantity, unit_price: unitPrice }
    })
    .filter((it) => it.unit_price > 0)

  const itemsSubtotal = displayItems.reduce(
    (sum, it) => sum + it.unit_price * it.quantity,
    0,
  )

  const discount = toMoney(body.discount)
  const shipping = toMoney(body.shipping)
  const giftFee = toMoney(body.giftFee)

  const preferenceItems: Array<{
    id: string
    title: string
    quantity: number
    unit_price: number
    currency_id: string
  }> = displayItems.map((it, i) => ({
    id: `${orderNumber}-${i + 1}`,
    title: it.title,
    quantity: it.quantity,
    unit_price: it.unit_price,
    currency_id: 'BRL',
  }))

  // Linhas de ajuste (desconto de cupom, frete e embalagem).
  if (discount > 0) {
    preferenceItems.push({
      id: `${orderNumber}-desconto`,
      title: 'Desconto (cupom)',
      quantity: 1,
      unit_price: -discount,
      currency_id: 'BRL',
    })
  }
  if (shipping > 0) {
    preferenceItems.push({
      id: `${orderNumber}-frete`,
      title: 'Frete',
      quantity: 1,
      unit_price: shipping,
      currency_id: 'BRL',
    })
  }
  if (giftFee > 0) {
    preferenceItems.push({
      id: `${orderNumber}-embalagem`,
      title: 'Embalagem para presente',
      quantity: 1,
      unit_price: giftFee,
      currency_id: 'BRL',
    })
  }

  // Reconciliação: força o somatório a bater EXATAMENTE com o total do pedido
  // calculado no servidor (fonte de verdade). Cobre qualquer divergência de
  // arredondamento ou preço enviado pelo cliente.
  const computedTotal = toMoney(
    itemsSubtotal - discount + shipping + giftFee,
  )
  const adjustment = toMoney(total - computedTotal)
  if (adjustment !== 0) {
    preferenceItems.push({
      id: `${orderNumber}-ajuste`,
      title: 'Ajuste',
      quantity: 1,
      unit_price: adjustment,
      currency_id: 'BRL',
    })
  }

  // Se, por algum motivo, não houver itens válidos, envia uma linha única
  // com o total autoritativo do pedido.
  if (preferenceItems.length === 0) {
    preferenceItems.push({
      id: orderNumber,
      title: `Pedido ${orderNumber} — Zig Zag Baby`,
      quantity: 1,
      unit_price: total,
      currency_id: 'BRL',
    })
  }

  // ---- Dados do comprador (pré-preenche o checkout) ----
  const payerName = String(body.payer?.name ?? '').trim()
  const [firstName, ...rest] = payerName.split(/\s+/)
  const payer = {
    name: firstName || undefined,
    surname: rest.join(' ') || undefined,
    email: String(body.payer?.email ?? '').trim() || undefined,
  }

  try {
    const preference = new Preference(getMercadoPagoConfig())

    const result = await preference.create({
      body: {
        items: preferenceItems,
        payer,
        external_reference: orderId,
        statement_descriptor: 'ZIGZAGBABY',
        back_urls: {
          success: `${origin}/checkout/sucesso?pedido=${encodeURIComponent(orderNumber)}`,
          pending: `${origin}/checkout/pendente?pedido=${encodeURIComponent(orderNumber)}`,
          failure: `${origin}/checkout/falha?pedido=${encodeURIComponent(orderNumber)}`,
        },
        auto_return: 'approved',
        notification_url: `${origin}/api/checkout/mercadopago/webhook`,
      },
      requestOptions: {
        // Evita criação duplicada de preferência ao reenviar o mesmo pedido.
        idempotencyKey: `pref-${orderId}`,
      },
    })

    const initPoint = result.init_point ?? result.sandbox_init_point
    if (!initPoint) {
      return NextResponse.json(
        { error: 'Mercado Pago não retornou a URL de checkout.' },
        { status: 502 },
      )
    }

    return NextResponse.json(
      { id: result.id, init_point: initPoint },
      { status: 200 },
    )
  } catch (err) {
    console.log('[v0] Erro ao criar preferência do Mercado Pago:', err)
    return NextResponse.json(
      { error: 'Não foi possível iniciar o pagamento. Tente novamente.' },
      { status: 502 },
    )
  }
}
