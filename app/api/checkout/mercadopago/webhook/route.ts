import { NextRequest, NextResponse } from 'next/server'
import { Payment } from 'mercadopago'

import { getMercadoPagoConfig } from '@/lib/mercadopago/client'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/**
 * Webhook de notificações do Mercado Pago (Checkout Pro).
 *
 * Fluxo:
 *  1. Extrai o ID do pagamento da notificação (query string ou corpo).
 *  2. Consulta o pagamento na API do Mercado Pago usando o Access Token
 *     do servidor — nunca confiamos apenas no que chega na requisição.
 *  3. Localiza o pedido pelo `external_reference` (= id do pedido).
 *  4. Mapeia o status do pagamento para os status do pedido e atualiza o
 *     Supabase, de forma IDEMPOTENTE (a mesma notificação não reaplica).
 *
 * IMPORTANTE: este handler NÃO cria pedidos e NÃO mexe em estoque. O pedido
 * e a baixa de estoque já foram feitos por `create_order` antes do redirect.
 * Aqui apenas refletimos o resultado do pagamento no pedido existente.
 *
 * Responde sempre 200 quando a notificação é processável (mesmo que ignorada),
 * para o Mercado Pago não reenviar indefinidamente. Só devolve 5xx em falha
 * transitória, de modo que o MP tente novamente.
 */
export async function POST(request: NextRequest) {
  // 1) Descobrir o ID do pagamento e o tipo do evento.
  let paymentId = ''
  let topic = ''

  const url = request.nextUrl
  topic =
    url.searchParams.get('type') ??
    url.searchParams.get('topic') ??
    ''
  paymentId =
    url.searchParams.get('data.id') ??
    url.searchParams.get('id') ??
    ''

  let rawBody: unknown = null
  try {
    rawBody = await request.json()
  } catch {
    rawBody = null
  }

  if (rawBody && typeof rawBody === 'object') {
    const b = rawBody as Record<string, any>
    topic = topic || b.type || b.topic || b.action || ''
    paymentId =
      paymentId ||
      b?.data?.id ||
      b?.data?.['id'] ||
      (typeof b.id === 'string' || typeof b.id === 'number' ? String(b.id) : '')
  }

  console.log(
    '[v0] Webhook Mercado Pago:',
    JSON.stringify({ topic, paymentId, query: url.search }),
  )

  // Só nos interessa evento de pagamento. Outros tópicos (merchant_order etc.)
  // são reconhecidos com 200 para não gerar reenvios.
  const isPaymentEvent =
    !topic || topic === 'payment' || topic.includes('payment')
  if (!isPaymentEvent || !paymentId) {
    return NextResponse.json(
      { received: true, ignored: true, reason: 'evento não é de pagamento' },
      { status: 200 },
    )
  }

  // 2) Consultar o pagamento na API do Mercado Pago (fonte de verdade).
  let payment: Record<string, any>
  try {
    const client = new Payment(getMercadoPagoConfig())
    payment = (await client.get({ id: paymentId })) as Record<string, any>
  } catch (err) {
    console.log(
      '[v0] Webhook: falha ao consultar pagamento no Mercado Pago:',
      paymentId,
      err,
    )
    // Falha transitória: pede reenvio.
    return NextResponse.json(
      { error: 'Falha ao consultar pagamento.' },
      { status: 502 },
    )
  }

  const orderId = String(payment.external_reference ?? '').trim()
  const mpStatus = String(payment.status ?? '').trim() // approved, pending, ...
  const confirmedPaymentId = String(payment.id ?? paymentId)

  if (!orderId) {
    console.log(
      '[v0] Webhook: pagamento sem external_reference, ignorando:',
      confirmedPaymentId,
    )
    return NextResponse.json(
      { received: true, ignored: true, reason: 'sem external_reference' },
      { status: 200 },
    )
  }

  // 3) Mapear status do pagamento -> status do pedido.
  const mapped = mapPaymentStatus(mpStatus)
  if (!mapped) {
    console.log('[v0] Webhook: status de pagamento não mapeado:', mpStatus)
    return NextResponse.json(
      { received: true, ignored: true, reason: `status ${mpStatus}` },
      { status: 200 },
    )
  }

  // 4) Atualizar o pedido com idempotência.
  const supabase = getSupabaseAdmin()

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, status, payment_status, payment_reference')
    .eq('id', orderId)
    .maybeSingle()

  if (fetchError) {
    console.log('[v0] Webhook: erro ao buscar pedido:', orderId, fetchError)
    return NextResponse.json(
      { error: 'Erro ao buscar pedido.' },
      { status: 502 },
    )
  }
  if (!order) {
    console.log('[v0] Webhook: pedido não encontrado:', orderId)
    return NextResponse.json(
      { received: true, ignored: true, reason: 'pedido inexistente' },
      { status: 200 },
    )
  }

  // Idempotência: se este mesmo pagamento já foi aplicado e o pedido já está
  // no estado final desejado, não faz nada.
  const alreadyApplied =
    order.payment_reference === confirmedPaymentId &&
    order.payment_status === mapped.payment_status
  if (alreadyApplied) {
    console.log(
      '[v0] Webhook: notificação já aplicada, ignorando (idempotente):',
      orderId,
      confirmedPaymentId,
    )
    return NextResponse.json(
      { received: true, idempotent: true },
      { status: 200 },
    )
  }

  // Não regride um pedido já pago (ex.: chega um evento antigo "pending"
  // depois do "approved"). Só atualizamos para "paid" ou para estados finais
  // negativos; nunca sobrescrevemos "paid" com algo inferior.
  if (order.payment_status === 'paid' && mapped.payment_status !== 'paid') {
    console.log(
      '[v0] Webhook: pedido já pago, ignorando downgrade para',
      mapped.payment_status,
    )
    return NextResponse.json(
      { received: true, ignored: true, reason: 'já pago' },
      { status: 200 },
    )
  }

  const update: Record<string, any> = {
    payment_status: mapped.payment_status,
    payment_reference: confirmedPaymentId,
    updated_at: new Date().toISOString(),
  }
  // Só promovemos o status geral do pedido quando aprovado. Para estados
  // negativos, marcamos o pedido como cancelado.
  if (mapped.order_status) {
    update.status = mapped.order_status
  }
  if (mapped.payment_status === 'paid') {
    update.paid_at = new Date().toISOString()
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update(update)
    .eq('id', orderId)

  if (updateError) {
    console.log('[v0] Webhook: erro ao atualizar pedido:', orderId, updateError)
    return NextResponse.json(
      { error: 'Erro ao atualizar pedido.' },
      { status: 502 },
    )
  }

  console.log(
    '[v0] Webhook: pedido atualizado',
    JSON.stringify({ orderId, mpStatus, ...mapped, confirmedPaymentId }),
  )

  return NextResponse.json({ received: true, updated: true }, { status: 200 })
}

/**
 * Mapeia o status do pagamento do Mercado Pago para os status válidos do
 * pedido no banco.
 *
 * payment_status válidos: pending | paid | refunded | canceled
 * status (pedido) válidos: pending | paid | processing | ... | canceled
 */
function mapPaymentStatus(mpStatus: string): {
  payment_status: 'pending' | 'paid' | 'refunded' | 'canceled'
  order_status?: 'paid' | 'canceled'
} | null {
  switch (mpStatus) {
    case 'approved':
      return { payment_status: 'paid', order_status: 'paid' }
    case 'pending':
    case 'in_process':
    case 'authorized':
      return { payment_status: 'pending' }
    case 'rejected':
    case 'cancelled':
      return { payment_status: 'canceled', order_status: 'canceled' }
    case 'refunded':
    case 'charged_back':
      return { payment_status: 'refunded' }
    default:
      return null
  }
}
