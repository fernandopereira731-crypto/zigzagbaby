import type { Metadata } from 'next'
import { SearchX } from 'lucide-react'
import { TopBar } from '@/components/store/top-bar'
import { SiteHeader } from '@/components/store/site-header'
import { SiteFooter } from '@/components/store/site-footer'
import { TrustBand } from '@/components/store/trust-band'
import { ProductCard } from '@/components/store/product-card'
import { searchProducts } from '@/lib/catalog-data'
import { whatsappUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Busca | Zig Zag Baby',
  description:
    'Encontre roupinhas infantis na Zig Zag Baby: busque por nome, tamanho, cor ou marca.',
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const term = (q ?? '').trim()
  const products = term ? await searchProducts(term) : []

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar />
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-14">
          <div className="mb-8 flex flex-col gap-2">
            <span className="text-sm font-bold uppercase tracking-wide text-primary">
              Resultados da busca
            </span>
            <h1 className="text-balance font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              {term ? (
                <>
                  {products.length}{' '}
                  {products.length === 1
                    ? 'resultado para'
                    : 'resultados para'}{' '}
                  <span className="text-primary">{`"${term}"`}</span>
                </>
              ) : (
                'O que você procura hoje?'
              )}
            </h1>
          </div>

          {!term ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <SearchX className="h-8 w-8" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="font-serif text-xl font-semibold text-foreground">
                  Digite algo para buscar
                </h2>
                <p className="mx-auto max-w-md text-sm text-muted-foreground">
                  Use a barra de busca acima para encontrar roupinhas por nome,
                  tamanho, cor ou marca.
                </p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <SearchX className="h-8 w-8" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="font-serif text-xl font-semibold text-foreground">
                  Nenhum produto encontrado
                </h2>
                <p className="mx-auto max-w-md text-sm text-muted-foreground">
                  Não encontramos nada para{' '}
                  <span className="font-semibold text-foreground">{`"${term}"`}</span>
                  . Tente outras palavras ou fale com a gente que ajudamos a
                  encontrar a roupinha perfeita.
                </p>
              </div>
              <a
                href={whatsappUrl(
                  `Olá! Estou procurando por "${term}" e gostaria de ajuda.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Falar no WhatsApp
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
        <TrustBand />
      </main>
      <SiteFooter />
    </div>
  )
}
