'use client'

import { getSupabaseBrowserClient } from './auth/supabase-client'
import type { ProductStatus } from './admin-data'
import type { UploadedPhoto } from './sections/photo-uploader'

/**
 * Camada de acesso a dados do painel administrativo.
 *
 * Todas as operações usam o cliente Supabase do navegador (mesma sessão do
 * admin autenticado). As políticas RLS garantem que apenas administradores
 * possam escrever no catálogo e no bucket de imagens.
 */

export type AdminProductRow = {
  id: string
  name: string
  image: string
  category: string
  brand: string
  price: number
  stock: number
  sizes: string[]
  status: ProductStatus
}

export type AdminCategory = { id: string; name: string; slug: string }

export type ProductFormValues = {
  name: string
  categoryId: string
  brand: string
  description: string
  color: string
  sizes: string[]
  price: number
  pixPrice: number | null
  promoPrice: number | null
  stock: number
  status: ProductStatus
  sku: string
  barcode: string
  weightKg: number | null
  dimensions: string
}

export type ProductDetail = ProductFormValues & {
  id: string
  photos: UploadedPhoto[]
}

const BUCKET = 'product-images'

function client() {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    throw new Error('Supabase não está conectado.')
  }
  return supabase
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${base || 'produto'}-${suffix}`
}

/** Converte um data URL (WebP) em Blob para upload. */
function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(',')
  const mime = /:(.*?);/.exec(meta)?.[1] ?? 'image/webp'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

/** Faz upload das fotos (data URLs) e retorna as URLs públicas, em ordem. */
async function uploadPhotos(
  productId: string,
  photos: UploadedPhoto[],
): Promise<string[]> {
  const supabase = client()
  const urls: string[] = []
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    // Fotos já existentes (http) são mantidas como estão.
    if (/^https?:\/\//.test(photo.url)) {
      urls.push(photo.url)
      continue
    }
    const blob = dataUrlToBlob(photo.url)
    const path = `products/${productId}/${Date.now()}-${i}.webp`
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: 'image/webp', upsert: true })
    if (error) throw new Error(`Falha ao enviar imagem: ${error.message}`)
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    urls.push(data.publicUrl)
  }
  return urls
}

/** Lista todas as categorias ativas. */
export async function listCategories(): Promise<AdminCategory[]> {
  const supabase = client()
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

/** Lista os produtos com imagem principal e tamanhos agregados das variações. */
export async function listProducts(): Promise<AdminProductRow[]> {
  const supabase = client()
  const { data, error } = await supabase
    .from('products')
    .select(
      `id, name, brand, price, stock, status,
       categories ( name ),
       product_images ( image_path, sort_order ),
       product_variants ( size, stock )`,
    )
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  return (data ?? []).map((p: any) => {
    const images = (p.product_images ?? [])
      .slice()
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    const variants = p.product_variants ?? []
    const sizes = Array.from(
      new Set(
        variants
          .map((v: any) => v.size)
          .filter((s: string | null): s is string => Boolean(s)),
      ),
    ) as string[]
    const variantStock = variants.reduce(
      (sum: number, v: any) => sum + (v.stock ?? 0),
      0,
    )
    return {
      id: p.id,
      name: p.name,
      image: images[0]?.image_path ?? '/placeholder.svg',
      category: p.categories?.name ?? '—',
      brand: p.brand ?? '—',
      price: Number(p.price) || 0,
      stock: variants.length > 0 ? variantStock : p.stock ?? 0,
      sizes,
      status: (p.status as ProductStatus) ?? 'ativo',
    }
  })
}

/** Busca um produto completo para edição. */
export async function getProduct(id: string): Promise<ProductDetail> {
  const supabase = client()
  const { data, error } = await supabase
    .from('products')
    .select(
      `id, name, description, brand, color, price, pix_price, promo_price,
       stock, status, sku, barcode, weight_kg, dimensions, category_id,
       product_images ( image_path, sort_order ),
       product_variants ( size )`,
    )
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)

  const p: any = data
  const images = (p.product_images ?? [])
    .slice()
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const sizes = Array.from(
    new Set(
      (p.product_variants ?? [])
        .map((v: any) => v.size)
        .filter((s: string | null): s is string => Boolean(s)),
    ),
  ) as string[]

  return {
    id: p.id,
    name: p.name ?? '',
    categoryId: p.category_id ?? '',
    brand: p.brand ?? '',
    description: p.description ?? '',
    color: p.color ?? '',
    sizes,
    price: Number(p.price) || 0,
    pixPrice: p.pix_price != null ? Number(p.pix_price) : null,
    promoPrice: p.promo_price != null ? Number(p.promo_price) : null,
    stock: p.stock ?? 0,
    status: (p.status as ProductStatus) ?? 'ativo',
    sku: p.sku ?? '',
    barcode: p.barcode ?? '',
    weightKg: p.weight_kg != null ? Number(p.weight_kg) : null,
    dimensions: p.dimensions ?? '',
    photos: images.map((img: any, i: number) => ({
      id: `existing-${i}`,
      url: img.image_path,
      name: `imagem-${i + 1}`,
      originalKb: 0,
      webpKb: 0,
    })),
  }
}

function buildProductRow(values: ProductFormValues) {
  return {
    name: values.name,
    description: values.description || null,
    brand: values.brand || null,
    color: values.color || null,
    category_id: values.categoryId || null,
    price: values.price,
    pix_price: values.pixPrice,
    promo_price: values.promoPrice,
    stock: values.stock,
    status: values.status,
    is_active: values.status !== 'inativo',
    sku: values.sku || null,
    barcode: values.barcode || null,
    weight_kg: values.weightKg,
    dimensions: values.dimensions || null,
  }
}

/** Grava as variações (uma por tamanho) do produto. */
async function replaceVariants(
  productId: string,
  values: ProductFormValues,
) {
  const supabase = client()
  await supabase.from('product_variants').delete().eq('product_id', productId)
  if (values.sizes.length === 0) return
  const perSize = Math.floor((values.stock || 0) / values.sizes.length)
  const rows = values.sizes.map((size) => ({
    product_id: productId,
    color: values.color || null,
    size,
    stock: perSize,
  }))
  const { error } = await supabase.from('product_variants').insert(rows)
  if (error) throw new Error(error.message)
}

/** Grava as imagens do produto (substitui as anteriores). */
async function replaceImages(productId: string, urls: string[]) {
  const supabase = client()
  await supabase.from('product_images').delete().eq('product_id', productId)
  if (urls.length === 0) return
  const rows = urls.map((url, i) => ({
    product_id: productId,
    image_path: url,
    sort_order: i,
  }))
  const { error } = await supabase.from('product_images').insert(rows)
  if (error) throw new Error(error.message)
}

/** Cria um novo produto com imagens e variações. */
export async function createProduct(
  values: ProductFormValues,
  photos: UploadedPhoto[],
): Promise<string> {
  const supabase = client()
  const { data, error } = await supabase
    .from('products')
    .insert({ ...buildProductRow(values), slug: slugify(values.name) })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  const id = data.id as string

  const urls = await uploadPhotos(id, photos)
  await replaceImages(id, urls)
  await replaceVariants(id, values)
  return id
}

/** Atualiza um produto existente. */
export async function updateProduct(
  id: string,
  values: ProductFormValues,
  photos: UploadedPhoto[],
): Promise<void> {
  const supabase = client()
  const { error } = await supabase
    .from('products')
    .update(buildProductRow(values))
    .eq('id', id)
  if (error) throw new Error(error.message)

  const urls = await uploadPhotos(id, photos)
  await replaceImages(id, urls)
  await replaceVariants(id, values)
}

/** Remove um produto (imagens e variações são removidas em cascata). */
export async function deleteProduct(id: string): Promise<void> {
  const supabase = client()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/** Duplica um produto existente (sem reaproveitar SKU). */
export async function duplicateProduct(id: string): Promise<void> {
  const detail = await getProduct(id)
  await createProduct(
    {
      ...detail,
      name: `${detail.name} (cópia)`,
      sku: '',
      barcode: '',
    },
    detail.photos,
  )
}

export type DashboardData = {
  ordersToday: number
  salesToday: number
  monthRevenue: number
  averageTicket: number
  totalProducts: number
  activeProducts: number
  lowStock: number
  customers: number
  pendingOrders: number
  shippedOrders: number
  canceledOrders: number
  recentOrders: {
    id: string
    customer: string
    city: string
    total: number
    status: string
  }[]
  topProducts: { name: string; sold: number }[]
}

/** Reúne todas as métricas reais do painel. */
export async function getDashboardData(): Promise<DashboardData> {
  const supabase = client()
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [
    productsCountRes,
    activeCountRes,
    customersCountRes,
    pendingRes,
    shippedRes,
    canceledRes,
    todayOrdersRes,
    monthOrdersRes,
    recentOrdersRes,
    variantsRes,
    orderItemsRes,
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ativo'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'shipped'),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'canceled'),
    supabase
      .from('orders')
      .select('total')
      .gte('created_at', startOfToday.toISOString()),
    supabase
      .from('orders')
      .select('total')
      .gte('created_at', startOfMonth.toISOString()),
    supabase
      .from('orders')
      .select('order_number, customer_name, shipping_address, total, status')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('products')
      .select('stock, product_variants ( stock )'),
    supabase.from('order_items').select('product_name, quantity'),
  ])

  const sum = (rows: { total: number | null }[] | null) =>
    (rows ?? []).reduce((acc, r) => acc + (Number(r.total) || 0), 0)

  const salesToday = sum(todayOrdersRes.data as any)
  const monthRows = (monthOrdersRes.data ?? []) as any[]
  const monthRevenue = sum(monthRows)
  const averageTicket = monthRows.length ? monthRevenue / monthRows.length : 0

  // Estoque baixo calculado pelas variações (ou estoque do produto sem variação).
  let lowStock = 0
  for (const p of (variantsRes.data ?? []) as any[]) {
    const variants = p.product_variants ?? []
    const total =
      variants.length > 0
        ? variants.reduce((s: number, v: any) => s + (v.stock ?? 0), 0)
        : p.stock ?? 0
    if (total > 0 && total <= 5) lowStock++
  }

  // Mais vendidos a partir dos itens de pedidos reais.
  const soldMap = new Map<string, number>()
  for (const it of (orderItemsRes.data ?? []) as any[]) {
    soldMap.set(
      it.product_name,
      (soldMap.get(it.product_name) ?? 0) + (it.quantity ?? 0),
    )
  }
  const topProducts = Array.from(soldMap.entries())
    .map(([name, sold]) => ({ name, sold }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5)

  const recentOrders = ((recentOrdersRes.data ?? []) as any[]).map((o) => ({
    id: o.order_number,
    customer: o.customer_name ?? 'Cliente',
    city: o.shipping_address?.city ?? '—',
    total: Number(o.total) || 0,
    status: o.status,
  }))

  return {
    ordersToday: (todayOrdersRes.data ?? []).length,
    salesToday,
    monthRevenue,
    averageTicket,
    totalProducts: productsCountRes.count ?? 0,
    activeProducts: activeCountRes.count ?? 0,
    lowStock,
    customers: customersCountRes.count ?? 0,
    pendingOrders: pendingRes.count ?? 0,
    shippedOrders: shippedRes.count ?? 0,
    canceledOrders: canceledRes.count ?? 0,
    recentOrders,
    topProducts,
  }
}
