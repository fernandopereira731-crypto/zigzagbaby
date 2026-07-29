'use client'

import { createClient } from '@/lib/supabase/client'

export type CheckoutCustomer = {
  name: string
  email: string
  phone: string
  cpf?: string
}

export type CheckoutAddress = {
  cep: string
  street: string
  number: string
  complement?: string
  district: string
  city: string
  state: string
} | null

export type CheckoutItemInput = {
  product_id: string
  size: string
  color: string
  quantity: number
}

export type CreateOrderInput = {
  customer: CheckoutCustomer
  address: CheckoutAddress
  items: CheckoutItemInput[]
  paymentMethod: string
  deliveryMethod: string
  giftWrap: boolean
  notes?: string
}

export type CreateOrderResult = {
  id: string
  order_number: string
  subtotal: number
  discount: number
  shipping: number
  gift_fee: number
  total: number
  items_count: number
}

/**
 * Cria o pedido no Supabase via RPC `create_order`.
 *
 * Toda a lógica sensível (validação de estoque, recálculo de preços com os
 * valores do banco, baixa de estoque atômica e cálculo de descontos) roda no
 * servidor dentro da função SECURITY DEFINER. O cliente apenas envia o que o
 * usuário escolheu — nunca preços.
 */
export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const supabase = createClient()

  // Vincula o pedido ao usuário logado (quando houver), para aparecer em Minha Conta.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase.rpc('create_order', {
    p_customer: input.customer,
    p_address: input.address,
    p_items: input.items,
    p_payment_method: input.paymentMethod,
    p_delivery_method: input.deliveryMethod,
    p_gift_wrap: input.giftWrap,
    p_notes: input.notes ?? null,
    p_profile_id: user?.id ?? null,
  })

  if (error) {
    throw new Error(error.message || 'Não foi possível concluir o pedido.')
  }

  return data as CreateOrderResult
}
