import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * Webhook de notificações do Mercado Pago.
 *
 * Por ora apenas confirma o recebimento (HTTP 200) para que o Mercado Pago
 * não fique reenviando as notificações. Não escreve nada no Supabase — a
 * baixa de estoque e o pedido já são tratados no fluxo de `create_order`.
 *
 * Ponto de extensão: aqui é onde, futuramente, dá para consultar o
 * pagamento pelo ID recebido e atualizar o status do pedido.
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null)
    console.log('[v0] Webhook Mercado Pago recebido:', JSON.stringify(payload))
  } catch {
    // Ignora corpos malformados — só precisamos responder 200.
  }
  return NextResponse.json({ received: true }, { status: 200 })
}
