'use client'

import { getSupabaseBrowserClient } from './auth/supabase-client'

/**
 * Camada de acesso aos pedidos no painel administrativo.
 *
 * Usa o cliente Supabase do admin autenticado. As políticas RLS garantem que
 * apenas administradores possam ler todos os pedidos e atualizar o status.
 */

export type AdminOrderItem = {
  id: string
  productName: string
  image: string | null
  size: string | null
  color: string | null
  unitPrice: number
  quantity: number
}

export type AdminOrderRow = {
  id: string
  orderNumber: string
  customer: string
  email: string | null
  phone: string | null
  city: string
  status: string
  paymentStatus: string
  paymentMethod: string | null
  deliveryMethod: string | null
  subtotal: number
  discount: number
  shipping: number
  giftFee: number
  giftWrap: boolean
  total: number
  notes: string | null
  createdAt: string
  itemsCount: number
  items: AdminOrderItem[]
}

/** Status disponíveis para o pedido, na ordem do fluxo de atendimento. */
export const ADMIN_ORDER_STATUSES = [
  'pending',
  'paid',
  'processing',
  'out_for_delivery',
  'shipped',
  'delivered',
  'canceled',
  'returned',
] as const

export type AdminOrderStatusValue = (typeof ADMIN_ORDER_STATUSES)[number]

export const ORDER_STATUS_LABELS: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: 'Pendente', className: 'bg-accent/25 text-accent-foreground' },
  paid: { label: 'Pago', className: 'bg-primary/15 text-primary' },
  processing: { label: 'Em separação', className: 'bg-primary/15 text-primary' },
  out_for_delivery: {
    label: 'Saiu para entrega',
    className: 'bg-chart-5/15 text-chart-5',
  },
  shipped: { label: 'Enviado', className: 'bg-chart-5/15 text-chart-5' },
  delivered: { label: 'Entregue', className: 'bg-whatsapp/15 text-whatsapp' },
  canceled: {
    label: 'Cancelado',
    className: 'bg-secondary text-secondary-foreground',
  },
  returned: {
    label: 'Devolvido',
    className: 'bg-secondary text-secondary-foreground',
  },
}

export function orderStatusLabel(status: string) {
  return (
    ORDER_STATUS_LABELS[status] ?? {
      label: status,
      className: 'bg-muted text-muted-foreground',
    }
  )
}

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'PIX',
  card: 'Cartão',
  cash: 'Dinheiro',
}

export function paymentMethodLabel(method: string | null): string {
  if (!method) return '—'
  return PAYMENT_LABELS[method] ?? method
}

const DELIVERY_LABELS: Record<string, string> = {
  today: 'Receber hoje',
  pickup: 'Retirar na loja',
  scheduled: 'Entrega agendada',
}

export function deliveryMethodLabel(method: string | null): string {
  if (!method) return '—'
  return DELIVERY_LABELS[method] ?? method
}

function client() {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    throw new Error('Supabase não está conectado.')
  }
  return supabase
}

/** Lista todos os pedidos com seus itens, mais recentes primeiro. */
export async function listOrders(): Promise<AdminOrderRow[]> {
  const supabase = client()
  const { data, error } = await supabase
    .from('orders')
    .select(
      `id, order_number, customer_name, customer_email, customer_phone,
       shipping_address, status, payment_status, payment_method, delivery_method,
       subtotal, discount, shipping, gift_fee, gift_wrap, total, notes, created_at,
       order_items ( id, product_name, image_path, size, color, unit_price, quantity )`,
    )
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  return (data ?? []).map((o: any) => {
    const items: AdminOrderItem[] = (o.order_items ?? []).map((it: any) => ({
      id: it.id,
      productName: it.product_name,
      image: it.image_path ?? null,
      size: it.size ?? null,
      color: it.color ?? null,
      unitPrice: Number(it.unit_price) || 0,
      quantity: it.quantity ?? 0,
    }))
    const address = o.shipping_address ?? {}
    const city = address.city
      ? `${address.city}${address.state ? ` - ${address.state}` : ''}`
      : '—'
    return {
      id: o.id,
      orderNumber: o.order_number,
      customer: o.customer_name ?? 'Cliente',
      email: o.customer_email ?? null,
      phone: o.customer_phone ?? null,
      city,
      status: o.status,
      paymentStatus: o.payment_status,
      paymentMethod: o.payment_method ?? null,
      deliveryMethod: o.delivery_method ?? null,
      subtotal: Number(o.subtotal) || 0,
      discount: Number(o.discount) || 0,
      shipping: Number(o.shipping) || 0,
      giftFee: Number(o.gift_fee) || 0,
      giftWrap: Boolean(o.gift_wrap),
      total: Number(o.total) || 0,
      notes: o.notes ?? null,
      createdAt: o.created_at,
      itemsCount: items.reduce((sum, it) => sum + it.quantity, 0),
      items,
    }
  })
}

/** Atualiza o status de um pedido. */
export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<void> {
  const supabase = client()
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
  if (error) throw new Error(error.message)
}

/**
 * Exclui um pedido permanentemente via RPC segura (somente admin).
 * Por padrão, devolve as quantidades ao estoque dos produtos/variações.
 */
export async function deleteOrder(
  orderId: string,
  restoreStock = true,
): Promise<void> {
  const supabase = client()
  const { error } = await supabase.rpc('admin_delete_order', {
    p_order_id: orderId,
    p_restore_stock: restoreStock,
  })
  if (error) throw new Error(error.message)
}

export type OrderProductVariant = {
  id: string
  color: string | null
  size: string | null
  stock: number
}

export type OrderProductOption = {
  id: string
  name: string
  price: number
  stock: number
  image: string | null
  variants: OrderProductVariant[]
}

/** Lista produtos ativos com variações para montar um pedido manual. */
export async function listOrderProducts(): Promise<OrderProductOption[]> {
  const supabase = client()
  const { data, error } = await supabase
    .from('products')
    .select(
      `id, name, price, stock, is_active,
       product_images ( image_path, sort_order ),
       product_variants ( id, color, size, stock )`,
    )
    .eq('is_active', true)
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)

  return (data ?? []).map((p: any) => {
    const images = (p.product_images ?? [])
      .slice()
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    return {
      id: p.id,
      name: p.name,
      price: Number(p.price) || 0,
      stock: Number(p.stock) || 0,
      image: images[0]?.image_path ?? null,
      variants: (p.product_variants ?? []).map((v: any) => ({
        id: v.id,
        color: v.color ?? null,
        size: v.size ?? null,
        stock: Number(v.stock) || 0,
      })),
    }
  })
}

export type ManualOrderItemInput = {
  productId: string
  variantId?: string | null
  productName: string
  color?: string | null
  size?: string | null
  unitPrice: number
  quantity: number
  imagePath?: string | null
}

export type ManualOrderInput = {
  profileId?: string | null
  customerName: string
  customerPhone?: string | null
  customerEmail?: string | null
  items: ManualOrderItemInput[]
  discount?: number
  shipping?: number
  paymentMethod?: string | null
  notes?: string | null
  origin?: string
  couponCode?: string | null
}

/** Cria um pedido manual via RPC segura, com baixa de estoque atômica. */
export async function createManualOrder(
  input: ManualOrderInput,
): Promise<{ id: string; orderNumber: string; total: number }> {
  const supabase = client()
  const items = input.items.map((it) => ({
    product_id: it.productId,
    variant_id: it.variantId ?? null,
    product_name: it.productName,
    color: it.color ?? null,
    size: it.size ?? null,
    unit_price: it.unitPrice,
    quantity: it.quantity,
    image_path: it.imagePath ?? null,
  }))

  const { data, error } = await supabase.rpc('admin_create_order', {
    p_profile_id: input.profileId ?? null,
    p_customer_name: input.customerName,
    p_customer_phone: input.customerPhone ?? null,
    p_customer_email: input.customerEmail ?? null,
    p_items: items,
    p_discount: input.discount ?? 0,
    p_shipping: input.shipping ?? 0,
    p_payment_method: input.paymentMethod ?? null,
    p_notes: input.notes ?? null,
    p_origin: input.origin ?? 'whatsapp',
    p_coupon_code: input.couponCode ?? null,
  })
  if (error) throw new Error(error.message)
  return {
    id: data.id,
    orderNumber: data.order_number,
    total: Number(data.total) || 0,
  }
}

/** Formata a data do pedido para exibição. */
export function formatOrderDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}
