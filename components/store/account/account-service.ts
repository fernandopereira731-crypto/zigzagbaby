'use client'

import { createClient } from '@/lib/supabase/client'
import type { PreferredStyle } from '@/lib/children-profiles'

/* ------------------------------------------------------------------ */
/*  Tipos                                                              */
/* ------------------------------------------------------------------ */

export type Profile = {
  id: string
  fullName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  cpf: string
  birthDate: string
  createdAt: string
}

export type Child = {
  id: string
  childName: string
  birthDate: string
  preferredStyle: PreferredStyle
}

export type ChildInput = {
  childName: string
  birthDate: string
  preferredStyle: PreferredStyle
}

export type Address = {
  id: string
  label: string
  recipientName: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  isDefault: boolean
}

export type AddressInput = Omit<Address, 'id'>

export type FavoriteProduct = {
  id: string
  slug: string
  name: string
  image: string
  price: number
  pixPrice: number
  category: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function round2(n: number) {
  return Math.round(n * 100) / 100
}

async function requireUserId(): Promise<string> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Você precisa estar logada para continuar.')
  return user.id
}

/* ------------------------------------------------------------------ */
/*  Perfil                                                             */
/* ------------------------------------------------------------------ */

export async function fetchProfile(): Promise<Profile | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, full_name, first_name, last_name, email, phone, cpf, birth_date, created_at',
    )
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.log('[v0] fetchProfile error:', error.message)
    throw new Error('Não foi possível carregar seu perfil.')
  }
  if (!data) return null

  return {
    id: data.id,
    fullName: data.full_name ?? '',
    firstName: data.first_name ?? '',
    lastName: data.last_name ?? '',
    email: data.email ?? user.email ?? '',
    phone: data.phone ?? '',
    cpf: data.cpf ?? '',
    birthDate: data.birth_date ?? '',
    createdAt: data.created_at ?? '',
  }
}

export async function updateProfile(input: {
  fullName: string
  phone: string
  cpf: string
  birthDate: string
}): Promise<void> {
  const supabase = createClient()
  const userId = await requireUserId()

  const trimmed = input.fullName.trim()
  const firstName = trimmed.split(' ')[0] ?? ''
  const lastName = trimmed.split(' ').slice(1).join(' ')

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: trimmed,
      first_name: firstName,
      last_name: lastName,
      phone: input.phone.trim() || null,
      cpf: input.cpf.trim() || null,
      birth_date: input.birthDate || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.log('[v0] updateProfile error:', error.message)
    throw new Error('Não foi possível salvar seus dados.')
  }
}

/* ------------------------------------------------------------------ */
/*  Crianças                                                           */
/* ------------------------------------------------------------------ */

export async function fetchChildren(): Promise<Child[]> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('children_profiles')
    .select('id, child_name, birth_date, preferred_style')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.log('[v0] fetchChildren error:', error.message)
    throw new Error('Não foi possível carregar as crianças.')
  }

  return (data ?? []).map((c) => ({
    id: c.id,
    childName: c.child_name ?? '',
    birthDate: c.birth_date ?? '',
    preferredStyle: (c.preferred_style ?? 'nao-informar') as PreferredStyle,
  }))
}

export async function addChild(input: ChildInput): Promise<Child> {
  const supabase = createClient()
  const userId = await requireUserId()

  const { data, error } = await supabase
    .from('children_profiles')
    .insert({
      profile_id: userId,
      child_name: input.childName.trim(),
      birth_date: input.birthDate || null,
      preferred_style: input.preferredStyle,
    })
    .select('id, child_name, birth_date, preferred_style')
    .single()

  if (error) {
    console.log('[v0] addChild error:', error.message)
    throw new Error('Não foi possível adicionar a criança.')
  }

  return {
    id: data.id,
    childName: data.child_name ?? '',
    birthDate: data.birth_date ?? '',
    preferredStyle: (data.preferred_style ?? 'nao-informar') as PreferredStyle,
  }
}

/**
 * Persiste as crianças informadas no cadastro quando a confirmação de e-mail
 * está ativa. Elas ficam guardadas em user_metadata.pending_children até o
 * primeiro acesso autenticado; então são inseridas e o marcador é limpo.
 */
export async function flushPendingChildren(): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const pending = user.user_metadata?.pending_children
  if (!Array.isArray(pending) || pending.length === 0) return

  for (const child of pending) {
    const childName = String(child?.childName ?? '').trim()
    if (!childName) continue
    try {
      await addChild({
        childName,
        birthDate: String(child?.birthDate ?? ''),
        preferredStyle: (child?.preferredStyle ?? 'nao-informar') as PreferredStyle,
      })
    } catch (err) {
      console.log('[v0] flushPendingChildren addChild error:', err)
    }
  }

  // Limpa o marcador para não reinserir em acessos futuros.
  await supabase.auth.updateUser({ data: { pending_children: null } })
}

export async function updateChild(
  id: string,
  input: ChildInput,
): Promise<void> {
  const supabase = createClient()
  const userId = await requireUserId()

  const { error } = await supabase
    .from('children_profiles')
    .update({
      child_name: input.childName.trim(),
      birth_date: input.birthDate || null,
      preferred_style: input.preferredStyle,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('profile_id', userId)

  if (error) {
    console.log('[v0] updateChild error:', error.message)
    throw new Error('Não foi possível atualizar a criança.')
  }
}

export async function deleteChild(id: string): Promise<void> {
  const supabase = createClient()
  const userId = await requireUserId()

  const { error } = await supabase
    .from('children_profiles')
    .delete()
    .eq('id', id)
    .eq('profile_id', userId)

  if (error) {
    console.log('[v0] deleteChild error:', error.message)
    throw new Error('Não foi possível remover a criança.')
  }
}

/* ------------------------------------------------------------------ */
/*  Endereços                                                          */
/* ------------------------------------------------------------------ */

function mapAddress(row: any): Address {
  return {
    id: row.id,
    label: row.label ?? '',
    recipientName: row.recipient_name ?? '',
    street: row.street ?? '',
    number: row.number ?? '',
    complement: row.complement ?? '',
    neighborhood: row.neighborhood ?? '',
    city: row.city ?? '',
    state: row.state ?? '',
    zipCode: row.zip_code ?? '',
    isDefault: Boolean(row.is_default),
  }
}

function addressToRow(input: AddressInput) {
  return {
    label: input.label.trim() || 'Endereço',
    recipient_name: input.recipientName.trim() || null,
    street: input.street.trim(),
    number: input.number.trim() || null,
    complement: input.complement.trim() || null,
    neighborhood: input.neighborhood.trim() || null,
    city: input.city.trim(),
    state: input.state.trim(),
    zip_code: input.zipCode.trim(),
    is_default: input.isDefault,
  }
}

export async function fetchAddresses(): Promise<Address[]> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('addresses')
    .select(
      'id, label, recipient_name, street, number, complement, neighborhood, city, state, zip_code, is_default, created_at',
    )
    .eq('profile_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.log('[v0] fetchAddresses error:', error.message)
    throw new Error('Não foi possível carregar seus endereços.')
  }
  return (data ?? []).map(mapAddress)
}

/** Garante que só exista um endereço padrão por usuário. */
async function clearDefaults(userId: string, exceptId?: string) {
  const supabase = createClient()
  let query = supabase
    .from('addresses')
    .update({ is_default: false })
    .eq('profile_id', userId)
    .eq('is_default', true)
  if (exceptId) query = query.neq('id', exceptId)
  await query
}

export async function addAddress(input: AddressInput): Promise<Address> {
  const supabase = createClient()
  const userId = await requireUserId()

  const { data: existing } = await supabase
    .from('addresses')
    .select('id')
    .eq('profile_id', userId)
    .limit(1)
  const isFirst = !existing || existing.length === 0
  const makeDefault = input.isDefault || isFirst

  if (makeDefault) await clearDefaults(userId)

  const { data, error } = await supabase
    .from('addresses')
    .insert({ ...addressToRow({ ...input, isDefault: makeDefault }), profile_id: userId })
    .select(
      'id, label, recipient_name, street, number, complement, neighborhood, city, state, zip_code, is_default',
    )
    .single()

  if (error) {
    console.log('[v0] addAddress error:', error.message)
    throw new Error('Não foi possível adicionar o endereço.')
  }
  return mapAddress(data)
}

export async function updateAddress(
  id: string,
  input: AddressInput,
): Promise<void> {
  const supabase = createClient()
  const userId = await requireUserId()

  if (input.isDefault) await clearDefaults(userId, id)

  const { error } = await supabase
    .from('addresses')
    .update({ ...addressToRow(input), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('profile_id', userId)

  if (error) {
    console.log('[v0] updateAddress error:', error.message)
    throw new Error('Não foi possível atualizar o endereço.')
  }
}

export async function deleteAddress(id: string): Promise<void> {
  const supabase = createClient()
  const userId = await requireUserId()

  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', id)
    .eq('profile_id', userId)

  if (error) {
    console.log('[v0] deleteAddress error:', error.message)
    throw new Error('Não foi possível remover o endereço.')
  }
}

export async function setDefaultAddress(id: string): Promise<void> {
  const supabase = createClient()
  const userId = await requireUserId()

  await clearDefaults(userId, id)
  const { error } = await supabase
    .from('addresses')
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('profile_id', userId)

  if (error) {
    console.log('[v0] setDefaultAddress error:', error.message)
    throw new Error('Não foi possível definir o endereço padrão.')
  }
}

/* ------------------------------------------------------------------ */
/*  Favoritos                                                          */
/* ------------------------------------------------------------------ */

/** Reidrata os produtos favoritos a partir dos ids (loja usa Supabase). */
export async function fetchFavoriteProducts(
  ids: string[],
): Promise<FavoriteProduct[]> {
  if (ids.length === 0) return []
  const supabase = createClient()

  const { data, error } = await supabase
    .from('products')
    .select(
      `id, slug, name, price, pix_price, promo_price,
       categories ( name ),
       product_images ( image_path, sort_order )`,
    )
    .in('id', ids)
    .eq('status', 'ativo')

  if (error) {
    console.log('[v0] fetchFavoriteProducts error:', error.message)
    throw new Error('Não foi possível carregar seus favoritos.')
  }

  return (data ?? []).map((row: any) => {
    const images = [...(row.product_images ?? [])].sort(
      (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    )
    const price = Number(row.price ?? 0)
    const pixPrice =
      row.pix_price != null ? Number(row.pix_price) : round2(price * 0.95)
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      image: images[0]?.image_path ?? '/placeholder.svg',
      price,
      pixPrice,
      category: row.categories?.name ?? 'Loja',
    }
  })
}
