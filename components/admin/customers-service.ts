'use client'

import { getSupabaseBrowserClient } from './auth/supabase-client'
import type { ChildSex, PreferredStyle } from '@/lib/children-profiles'

/**
 * Camada de acesso aos clientes no painel administrativo.
 *
 * Usa o cliente Supabase do admin autenticado e as RPCs SECURITY DEFINER
 * `admin_list_customers` / `admin_get_customer_detail`, que validam is_admin()
 * internamente antes de agregar os dados reais.
 */

export type AdminCustomerRow = {
  id: string
  name: string
  email: string | null
  phone: string | null
  city: string
  createdAt: string
  orders: number
  totalSpent: number
  lastPurchase: string | null
  favoritesCount: number
  childrenCount: number
}

export type AdminCustomerChild = {
  id: string
  childName: string
  birthDate: string
  sex: ChildSex
  preferredStyle: PreferredStyle
}

export type AdminCustomerAddress = {
  id: string
  label: string | null
  recipient_name: string | null
  street: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  is_default: boolean
}

export type AdminCustomerOrder = {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  paymentMethod: string | null
  itemsCount: number
}

export type AdminCustomerFavorite = {
  id: string
  productId: string
  productName: string | null
  price: number | null
}

export type AdminCustomerDetail = {
  name: string
  email: string | null
  phone: string | null
  cpf: string | null
  birthDate: string | null
  createdAt: string | null
  totalSpent: number
  children: AdminCustomerChild[]
  addresses: AdminCustomerAddress[]
  orders: AdminCustomerOrder[]
  favorites: AdminCustomerFavorite[]
}

function client() {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    throw new Error('Supabase não está conectado.')
  }
  return supabase
}

/** Lista todos os clientes com métricas agregadas, mais recentes primeiro. */
export async function listCustomers(): Promise<AdminCustomerRow[]> {
  const supabase = client()
  const { data, error } = await supabase.rpc('admin_list_customers')
  if (error) throw new Error(error.message)

  return (data ?? []).map((c: any) => {
    const city = c.city ? String(c.city) : '—'
    return {
      id: c.id,
      name: c.full_name?.trim() || 'Cliente',
      email: c.email ?? null,
      phone: c.phone ?? null,
      city,
      createdAt: c.created_at,
      orders: Number(c.orders_count) || 0,
      totalSpent: Number(c.total_spent) || 0,
      lastPurchase: c.last_purchase ?? null,
      favoritesCount: Number(c.favorites_count) || 0,
      childrenCount: Number(c.children_count) || 0,
    }
  })
}

/** Detalhes completos de um cliente (filhos, endereços, pedidos, favoritos). */
export async function getCustomerDetail(
  profileId: string,
): Promise<AdminCustomerDetail> {
  const supabase = client()
  const { data, error } = await supabase.rpc('admin_get_customer_detail', {
    p_profile_id: profileId,
  })
  if (error) throw new Error(error.message)

  const profile = data?.profile ?? {}
  const children = (data?.children ?? []).map((c: any) => ({
    id: c.id,
    childName: c.child_name,
    birthDate: c.birth_date,
    sex: (c.sex ?? 'nao-informar') as ChildSex,
    preferredStyle: (c.preferred_style ?? 'nao-informar') as PreferredStyle,
  }))
  const addresses = (data?.addresses ?? []) as AdminCustomerAddress[]
  const orders = (data?.orders ?? []).map((o: any) => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    total: Number(o.total) || 0,
    createdAt: o.created_at,
    paymentMethod: o.payment_method ?? null,
    itemsCount: Number(o.items_count) || 0,
  }))
  const favorites = (data?.favorites ?? []).map((f: any) => ({
    id: f.id,
    productId: f.product_id,
    productName: f.product_name ?? null,
    price: f.price != null ? Number(f.price) : null,
  }))

  return {
    name: profile.full_name?.trim() || 'Cliente',
    email: profile.email ?? null,
    phone: profile.phone ?? null,
    cpf: profile.cpf ?? null,
    birthDate: profile.birth_date ?? null,
    createdAt: profile.created_at ?? null,
    totalSpent: Number(data?.total_spent) || 0,
    children,
    addresses,
    orders,
    favorites,
  }
}

export type NewChildInput = {
  name: string
  sex: ChildSex
  birthDate: string
}

export type NewCustomerInput = {
  fullName: string
  phone?: string
  email?: string
  cpf?: string
  birthDate?: string
  notes?: string
  origin?: string
  address?: {
    street: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
    zipCode?: string
  }
  children?: NewChildInput[]
}

/**
 * Cria um cliente manualmente.
 *
 * Como `profiles.id` referencia `auth.users`, a criação ocorre no servidor
 * (rota `/api/admin/create-customer`), que usa a service role para criar o
 * usuário de auth e enriquecer o perfil. Enviamos o token do admin para que
 * o servidor valide a permissão.
 */
export async function createCustomer(
  input: NewCustomerInput,
): Promise<string> {
  const supabase = client()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Sessão expirada. Faça login novamente.')

  const res = await fetch('/api/admin/create-customer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  })

  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(payload?.error ?? 'Não foi possível cadastrar o cliente.')
  }
  return payload.id as string
}

/**
 * Exclui um cliente permanentemente.
 *
 * Assim como a criação, ocorre no servidor (rota `/api/admin/delete-customer`),
 * que usa a service role para remover o usuário de auth. Perfil, crianças e
 * endereços são apagados em cascata; os pedidos ficam preservados no histórico.
 */
export async function deleteCustomer(customerId: string): Promise<void> {
  const supabase = client()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Sessão expirada. Faça login novamente.')

  const res = await fetch('/api/admin/delete-customer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ customerId }),
  })

  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(payload?.error ?? 'Não foi possível excluir o cliente.')
  }
}

/** Lista simples de clientes (id + nome + contato) para seletor de pedidos. */
export async function listCustomerOptions(): Promise<
  { id: string; name: string; phone: string | null; email: string | null }[]
> {
  const rows = await listCustomers()
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
  }))
}

/** Formata uma data ISO para exibição curta em pt-BR. */
export function formatCustomerDate(iso: string | null): string {
  if (!iso) return '—'
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
