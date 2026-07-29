import { PackageOpen } from 'lucide-react'
import { getActiveProducts } from '@/lib/catalog-data'
import { whatsappUrl } from '@/lib/site'
import { Reveal } from './reveal'
import { ProductCard } from './product-card'

export async function FeaturedProducts() {
  const products = await getActiveProducts(8)

  return (
    <section
      id="produtos"
      aria-labelledby="produtos-titulo"
      className="scroll-mt-28 bg-muted/40"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        <Reveal className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold uppercase tracking-wide text-primary">
              Seleção especial
            </span>
            <h2
              id="produtos-titulo"
              className="text-balance font-serif text-3xl font-semibold text-foreground sm:text-4xl"
            >
              Produtos em destaque
            </h2>
          </div>
          {products.length > 0 && (
            <a
              href="#produtos"
              className="text-sm font-bold text-primary underline-offset-4 hover:underline"
            >
              Ver todos os produtos
            </a>
          )}
        </Reveal>

        {products.length === 0 ? (
          <Reveal className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <PackageOpen className="h-8 w-8" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="font-serif text-xl font-semibold text-foreground">
                Nossa vitrine está sendo preparada
              </h3>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Em breve novas roupinhas escolhidas com carinho estarão por aqui.
                Volte logo para conferir as novidades da Zig Zag Baby.
              </p>
            </div>
            <a
              href={whatsappUrl(
                'Olá! Gostaria de saber quando terão novas roupinhas disponíveis.',
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Fale com a gente
            </a>
          </Reveal>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {products.map((product, i) => (
              <Reveal key={product.id} delay={(i % 4) * 80}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
