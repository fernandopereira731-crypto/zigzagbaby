'use client'

import { createClient } from '@/lib/supabase/client'
import type { CartItem, CartProduct } from './store-context'

/**
 * Sincronização de carrinho e favoritos com o Supabase para usuários
 * autenticados. Visitantes continuam usando apenas o localStorage (feito no
 * StoreProvider). Nenhum dado é simulado.
 */

function round2(n: number) {
  return Math.round(n * 100) / 100
}

/* ----------------------------- Favoritos ----------------------------- */

export async function loadRemoteFavorites(userId: string): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('favorites')
    .select('product_id')
    .eq('profile_id', userId)
  if (error) {
    console.log('[v0] loadRemoteFavorites error:', error.message)
    return []
  }
  return (data ?? []).map((r) => r.product_id as string)
}

/** Une favoritos locais e remotos, grava os que faltam e devolve a união. */
export async function mergeFavorites(
  userId: string,
  localIds: string[],
): Promise<string[]> {
  const supabase = createClient()
  const remote = await loadRemoteFavorites(userId)
  const merged = Array.from(new Set([...remote, ...localIds]))

  const missing = merged.filter((id) => !remote.includes(id))
  if (missing.length > 0) {
    const rows = missing.map((product_id) => ({ profile_id: userId, product_id }))
    const { error } = await supabase.from('favorites').insert(rows)
    if (error) console.log('[v0] mergeFavorites insert error:', error.message)
  }
  return merged
}

export async function addRemoteFavorite(userId: string, productId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('favorites')
    .insert({ profile_id: userId, product_id: productId })
  // 23505 = violação de unique (já é favorito) → ignorar
  if (error && error.code !== '23505') {
    console.log('[v0] addRemoteFavorite error:', error.message)
  }
}

export async function removeRemoteFavorite(userId: string, productId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('profile_id', userId)
    .eq('product_id', productId)
  if (error) console.log('[v0] removeRemoteFavorite error:', error.message)
}

/* ------------------------------ Carrinho ----------------------------- */

type ProductRow = {
  id: string
  name: string
  price: number | null
  promo_price: number | null
  color: string | null
  product_images: { image_path: string; sort_order: number | null }[] | null
}

type VariantRow = {
  id: string
  product_id: string
  size: string | null
  color: string | null
}

function buildCartProduct(
  product: ProductRow,
  variant: VariantRow | null,
): CartProduct {
  const images = [...(product.product_images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  )
  const basePrice = Number(product.price ?? 0)
  const promo = product.promo_price != null ? Number(product.promo_price) : null
  const price = promo ?? basePrice
  const oldPrice = promo ? basePrice : undefined
  const color =
    variant?.color ??
    (product.color ? String(product.color).split(',')[0].trim() : '')
  return {
    id: product.id,
    name: product.name,
    price,
    oldPrice,
    image: images[0]?.image_path ?? '/placeholder.svg',
    color,
    size: variant?.size ?? '',
  }
}

/** Carrega o carrinho remoto e reidrata os snapshots a partir do catálogo. */
export async function loadRemoteCart(userId: string): Promise<CartItem[]> {
  const supabase = createClient()
  const { data: rows, error } = await supabase
    .from('cart_items')
    .select('product_id, variant_id, quantity')
    .eq('profile_id', userId)

  if (error) {
    console.log('[v0] loadRemoteCart error:', error.message)
    return []
  }
  if (!rows || rows.length === 0) return []

  const productIds = Array.from(new Set(rows.map((r) => r.product_id as string)))
  const variantIds = rows
    .map((r) => r.variant_id as string | null)
    .filter((v): v is string => Boolean(v))

  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, promo_price, color, product_images(image_path, sort_order)')
    .in('id', productIds)
    .eq('status', 'ativo')

  const variantsById = new Map<string, VariantRow>()
  if (variantIds.length > 0) {
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, product_id, size, color')
      .in('id', variantIds)
    for (const v of (variants ?? []) as VariantRow[]) variantsById.set(v.id, v)
  }

  const productsById = new Map<string, ProductRow>()
  for (const p of (products ?? []) as ProductRow[]) productsById.set(p.id, p)

  const items: CartItem[] = []
  for (const row of rows) {
    const product = productsById.get(row.product_id as string)
    if (!product) continue // produto inativo/removido → ignora
    const variant = row.variant_id
      ? variantsById.get(row.variant_id as string) ?? null
      : null
    items.push({
      product: buildCartProduct(product, variant),
      quantity: Number(row.quantity ?? 1),
    })
  }
  return items
}

/** Resolve o variant_id de um item a partir do product_id + tamanho. */
async function resolveVariantIds(
  items: CartItem[],
): Promise<Map<string, string | null>> {
  const supabase = createClient()
  const result = new Map<string, string | null>()
  const productIds = Array.from(new Set(items.map((i) => i.product.id)))
  if (productIds.length === 0) return result

  const { data: variants } = await supabase
    .from('product_variants')
    .select('id, product_id, size')
    .in('product_id', productIds)

  for (const item of items) {
    const size = item.product.size
    const match = (variants ?? []).find(
      (v: any) => v.product_id === item.product.id && v.size === size,
    )
    result.set(item.product.id, match?.id ?? null)
  }
  return result
}

/** Substitui o carrinho remoto pelo conjunto atual (evita duplicatas). */
export async function replaceRemoteCart(userId: string, items: CartItem[]) {
  const supabase = createClient()
  const { error: delError } = await supabase
    .from('cart_items')
    .delete()
    .eq('profile_id', userId)
  if (delError) {
    console.log('[v0] replaceRemoteCart delete error:', delError.message)
    return
  }
  if (items.length === 0) return

  const variantIds = await resolveVariantIds(items)
  const rows = items.map((item) => ({
    profile_id: userId,
    product_id: item.product.id,
    variant_id: variantIds.get(item.product.id) ?? null,
    quantity: item.quantity,
  }))
  const { error } = await supabase.from('cart_items').insert(rows)
  if (error) console.log('[v0] replaceRemoteCart insert error:', error.message)
}

/**
 * Mescla o carrinho local com o remoto (uma linha por produto, somando
 * quantidades) e persiste o resultado.
 */
export async function mergeCart(
  userId: string,
  localItems: CartItem[],
): Promise<CartItem[]> {
  const remote = await loadRemoteCart(userId)
  const byId = new Map<string, CartItem>()

  for (const item of remote) byId.set(item.product.id, { ...item })
  for (const item of localItems) {
    const existing = byId.get(item.product.id)
    if (existing) {
      existing.quantity += item.quantity
    } else {
      byId.set(item.product.id, { ...item })
    }
  }

  const merged = Array.from(byId.values())
  await replaceRemoteCart(userId, merged)
  return merged
}
