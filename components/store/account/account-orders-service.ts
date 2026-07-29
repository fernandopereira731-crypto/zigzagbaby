import { createClient } from '@/lib/supabase/client'
import type { Order, OrderStatus } from './account-data'

/** Item cru retornado pela RPC get_orders_by_email. */
type RpcItem = {
  id: string
  product_name: string
  image_path: string | null
  size: string | null
  color: string | null
  unit_price: number
  quantity: number
}

/** Pedido cru retornado pela RPC get_orders_by_email. */
type RpcOrder = {
  id: string
  order_number: string
  status: string
  payment_status: string
  payment_method: string | null
  delivery_method: string | null
  subtotal: number
  shipping: number
  discount: number
  gift_fee: number
  total: number
  created_at: string
  shipping_address: Record<string, unknown> | null
  items: RpcItem[]
}

/** Mapeia o status do banco para o status simplificado usado na UI da conta. */
function mapStatus(dbStatus: string): OrderStatus {
  switch (dbStatus) {
    case 'delivered':
      return 'entregue'
    case 'shipped':
    case 'out_for_delivery':
      return 'a-caminho'
    case 'canceled':
    case 'returned':
      return 'cancelado'
    default:
      // pending, paid, processing
      return 'preparando'
  }
}

const DATE_FMT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const DATE_TIME_FMT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

function formatDate(iso: string) {
  return DATE_FMT.format(new Date(iso)).replace(/\./g, '')
}

function formatDateTime(iso: string) {
  return DATE_TIME_FMT.format(new Date(iso)).replace(/\./g, '')
}

/**
 * Constrói a linha do tempo de rastreio a partir do status atual.
 * Os passos concluídos dependem de quão longe o pedido avançou.
 */
function buildTracking(dbStatus: string, createdAt: string): Order['tracking'] {
  // ordem lógica dos estágios
  const order = ['confirmed', 'processing', 'out_for_delivery', 'delivered']
  const reached: Record<string, number> = {
    pending: 0,
    paid: 0,
    processing: 1,
    out_for_delivery: 2,
    shipped: 2,
    delivered: 3,
    canceled: 0,
    returned: 3,
  }
  const level = reached[dbStatus] ?? 0
  const createdLabel = formatDateTime(createdAt)

  const steps: { key: string; step: string }[] = [
    { key: 'confirmed', step: 'Pedido confirmado' },
    { key: 'processing', step: 'Em separação' },
    { key: 'out_for_delivery', step: 'Saiu para entrega' },
    { key: 'delivered', step: 'Entregue' },
  ]

  return steps.map((s, i) => {
    const done = i <= level
    let date = ''
    if (i === 0) date = createdLabel
    else if (done) date = 'Concluído'
    else if (i === level + 1) date = 'Em breve'
    return { step: s.step, date, done }
  })
}

/** Converte as linhas cruas da RPC para o tipo Order usado na UI. */
function mapRows(rows: RpcOrder[]): Order[] {
  return rows.map((o) => ({
    id: `#${o.order_number}`,
    date: formatDate(o.created_at),
    status: mapStatus(o.status),
    total: Number(o.total),
    items: (o.items ?? []).map((it) => ({
      name: it.product_name,
      image: it.image_path || '/placeholder.svg',
      size: it.size || '-',
      color: it.color || '-',
      qty: it.quantity,
      price: Number(it.unit_price),
    })),
    tracking: buildTracking(o.status, o.created_at),
  }))
}

/**
 * Busca os pedidos do usuário autenticado (por profile_id, via RLS).
 * Esta é a fonte principal na área Minha Conta.
 */
export async function fetchMyOrders(): Promise<Order[]> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase.rpc('get_my_orders')

  if (error) {
    console.log('[v0] Erro ao buscar pedidos do usuário:', error.message)
    throw new Error('Não foi possível carregar seus pedidos.')
  }

  return mapRows((data ?? []) as RpcOrder[])
}

/**
 * Busca os pedidos reais de um cliente por e-mail.
 * Mantido apenas como fallback temporário (ex.: pedidos feitos como visitante).
 */
export async function fetchCustomerOrders(email: string): Promise<Order[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_orders_by_email', {
    p_email: email,
  })

  if (error) {
    console.log('[v0] Erro ao buscar pedidos da conta:', error.message)
    throw new Error('Não foi possível carregar seus pedidos.')
  }

  return mapRows((data ?? []) as RpcOrder[])
}
