import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { TopBar } from '@/components/store/top-bar'
import { SiteHeader } from '@/components/store/site-header'
import { SiteFooter } from '@/components/store/site-footer'
import { TrustBand } from '@/components/store/trust-band'
import { ProductMain } from '@/components/store/product/product-main'
import { WhyBuy } from '@/components/store/product/why-buy'
import { ProductDetails } from '@/components/store/product/product-details'
import { RelatedProducts } from '@/components/store/product/related-products'
import { ProductReviews } from '@/components/store/product/product-reviews'
import { MobileBuyBar } from '@/components/store/product/mobile-buy-bar'
import {
  getProductBySlug,
  getRelatedProducts,
} from '@/lib/catalog-data'

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) {
    return { title: 'Produto não encontrado | Zig Zag Baby' }
  }
  return {
    title: `${product.name} | Zig Zag Baby`,
    description:
      product.description ??
      `${product.name} na Zig Zag Baby. Qualidade e carinho em cada peça.`,
  }
}

export default async function ProdutoPage({ params }: Params) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) notFound()

  const related = await getRelatedProducts(product.categoryId, product.id)

  const breadcrumb = [
    { label: 'Início', href: '/' },
    ...(product.categoryName
      ? [{ label: product.categoryName, href: '/#categorias' }]
      : []),
    { label: product.name },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar />
      <SiteHeader />
      <main className="flex-1 pb-20 lg:pb-0">
        <nav
          aria-label="Trilha de navegação"
          className="border-b border-border bg-muted/30"
        >
          <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-1 px-4 py-3 text-xs lg:px-8">
            {breadcrumb.map((item, i) => {
              const last = i === breadcrumb.length - 1
              return (
                <li key={item.label} className="flex items-center gap-1">
                  {item.href ? (
                    <a
                      href={item.href}
                      className="font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span
                      className="font-bold text-foreground"
                      aria-current="page"
                    >
                      {item.label}
                    </span>
                  )}
                  {!last && (
                    <ChevronRight
                      className="h-3.5 w-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                </li>
              )
            })}
          </ol>
        </nav>

        <ProductMain product={product} />
        <WhyBuy />
        <ProductDetails product={product} />
        <RelatedProducts products={related} />
        <ProductReviews />
        <TrustBand />
      </main>
      <SiteFooter />
      <MobileBuyBar product={product} />
    </div>
  )
}
