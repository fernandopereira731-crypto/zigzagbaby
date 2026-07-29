import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type {
  PublicCategory,
  PublicGalleryItem,
  PublicProduct,
  PublicVariant,
} from '@/lib/catalog-types'

/**
 * Camada de leitura pública do catálogo (loja).
 *
 * Todas as funções leem diretamente do Supabase e retornam APENAS produtos
 * ativos (`status = 'ativo'`). Nada é simulado: quando o banco está vazio, as
 * funções retornam listas vazias e a UI mostra estados vazios elegantes.
 *
 * Observação: `product_images.image_path` já guarda a URL pública completa
 * (gerada por `getPublicUrl` no painel), portanto pode ser usada direto no src.
 */

export type {
  PublicCategory,
  PublicGalleryItem,
  PublicProduct,
  PublicVariant,
} from '@/lib/catalog-types'

const SIZE_ORDER = ['RN', 'P', 'M', 'G', 'GG', '1', '2', '3', '4', '6', '8', '10']

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a)
    const ib = SIZE_ORDER.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
}

function mapProduct(row: any): PublicProduct {
  const images = [...(row.product_images ?? [])].sort(
    (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  )
  const gallery: PublicGalleryItem[] = images.map((img: any) => ({
    src: img.image_path,
    alt: img.alt || row.name,
  }))
  const image = gallery[0]?.src ?? '/placeholder.svg'
  const image2 = gallery[1]?.src ?? image

  const variantList = (row.product_variants ?? [])
    .filter((v: any) => Boolean(v.size))
    .map((v: any) => ({ size: v.size as string, stock: Number(v.stock ?? 0) }))
  const sizes = sortSizes(
    Array.from(new Set(variantList.map((v: any) => v.size))) as string[],
  )
  // Consolida estoque por tamanho (caso haja variações repetidas).
  const variants = sizes.map((size) => ({
    size,
    stock: variantList
      .filter((v: any) => v.size === size)
      .reduce((sum: number, v: any) => sum + v.stock, 0),
  }))

  const colors = String(row.color ?? '')
    .split(',')
    .map((c: string) => c.trim())
    .filter(Boolean)

  const price = Number(row.price ?? 0)
  const pixPrice = row.pix_price != null ? Number(row.pix_price) : round2(price * 0.95)
  const compareAt = row.compare_at_price != null ? Number(row.compare_at_price) : null
  const oldPrice = compareAt && compareAt > price ? compareAt : undefined

  const reviews = Number(row.review_count ?? 0)
  const rating = Number(row.rating ?? 0)

  let tag: PublicProduct['tag']
  if (oldPrice) tag = { label: 'Promoção', tone: 'sale' }
  else if (row.is_featured) tag = { label: 'Novidade', tone: 'new' }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? null,
    brand: row.brand ?? null,
    sku: row.sku ?? null,
    color: row.color ?? null,
    price,
    pixPrice,
    oldPrice,
    image,
    image2,
    gallery,
    sizes,
    sizesLabel: sizes.length ? sizes.join(', ') : 'Tamanho único',
    variants,
    colors,
    stock: Number(row.stock ?? 0),
    rating,
    reviews,
    categoryId: row.category_id ?? null,
    categoryName: row.categories?.name ?? null,
    categorySlug: row.categories?.slug ?? null,
    tag,
  }
}

const PRODUCT_SELECT = `
  id, slug, name, description, brand, sku, color, price, pix_price,
  promo_price, compare_at_price, stock, rating, review_count, is_featured,
  status, category_id,
  categories ( name, slug ),
  product_images ( image_path, alt, sort_order ),
  product_variants ( size, stock )
`

export async function getActiveProducts(limit = 8): Promise<PublicProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'ativo')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.log('[v0] getActiveProducts error:', error.message)
    return []
  }
  return (data ?? []).map(mapProduct)
}

export async function getProductBySlug(slug: string): Promise<PublicProduct | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('status', 'ativo')
    .maybeSingle()

  if (error) {
    console.log('[v0] getProductBySlug error:', error.message)
    return null
  }
  return data ? mapProduct(data) : null
}

export async function getRelatedProducts(
  categoryId: string | null,
  excludeId: string,
  limit = 4,
): Promise<PublicProduct[]> {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'ativo')
    .neq('id', excludeId)
    .limit(limit)

  if (categoryId) query = query.eq('category_id', categoryId)

  const { data, error } = await query
  if (error) {
    console.log('[v0] getRelatedProducts error:', error.message)
    return []
  }
  return (data ?? []).map(mapProduct)
}

export async function searchProducts(
  term: string,
  limit = 48,
): Promise<PublicProduct[]> {
  const q = term?.trim()
  if (!q) return []

  const supabase = await createClient()

  // Busca sem acentos/maiúsculas via função no banco (retorna IDs ordenados).
  const { data: ids, error: rpcError } = await supabase.rpc(
    'search_product_ids',
    { term: q },
  )

  if (rpcError) {
    console.log('[v0] searchProducts rpc error:', rpcError.message)
    return []
  }

  const idList = (ids ?? []).map((row: any) =>
    typeof row === 'string' ? row : row.search_product_ids ?? row.id,
  )
  if (idList.length === 0) return []

  const limited = idList.slice(0, limit)
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .in('id', limited)

  if (error) {
    console.log('[v0] searchProducts fetch error:', error.message)
    return []
  }

  // Preserva a ordem de relevância retornada pela função de busca.
  const order = new Map<string, number>(
    limited.map((id: string, i: number) => [id, i] as [string, number]),
  )
  return (data ?? [])
    .map(mapProduct)
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
}

export async function getCategoriesWithCounts(): Promise<PublicCategory[]> {
  const supabase = await createClient()
  const { data: cats, error } = await supabase
    .from('categories')
    .select('id, slug, name')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error || !cats) {
    console.log('[v0] getCategoriesWithCounts error:', error?.message)
    return []
  }

  const counts = await Promise.all(
    cats.map(async (c) => {
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'ativo')
        .eq('category_id', c.id)
      return { ...c, count: count ?? 0 }
    }),
  )
  return counts
}
