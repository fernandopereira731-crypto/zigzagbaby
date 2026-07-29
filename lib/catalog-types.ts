/**
 * Tipos compartilhados do catálogo (seguros para client e server).
 * A leitura de dados fica em `lib/catalog-data.ts` (server-only).
 */

export type PublicGalleryItem = { src: string; alt: string; video?: boolean }

export type PublicVariant = { size: string; stock: number }

export type PublicProduct = {
  id: string
  slug: string
  name: string
  description: string | null
  brand: string | null
  sku: string | null
  color: string | null
  price: number
  pixPrice: number
  oldPrice?: number
  image: string
  image2: string
  gallery: PublicGalleryItem[]
  sizes: string[]
  sizesLabel: string
  variants: PublicVariant[]
  colors: string[]
  stock: number
  rating: number
  reviews: number
  categoryId: string | null
  categoryName: string | null
  categorySlug: string | null
  tag?: { label: string; tone: 'sale' | 'new' }
}

export type PublicCategory = {
  id: string
  slug: string
  name: string
  count: number
}
