import type { PublicProduct } from '@/lib/catalog-types'
import { Reveal } from '../reveal'
import { ProductCard } from '../product-card'

export function RelatedProducts({ products }: { products: PublicProduct[] }) {
  if (products.length === 0) return null

  return (
    <section aria-labelledby="relacionados-titulo" className="bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        <Reveal className="mb-8 flex flex-col gap-2">
          <span className="text-sm font-bold uppercase tracking-wide text-primary">
            Combina com o seu carrinho
          </span>
          <h2
            id="relacionados-titulo"
            className="text-balance font-serif text-3xl font-semibold text-foreground sm:text-4xl"
          >
            Você também pode gostar
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products.map((product, i) => (
            <Reveal key={product.id} delay={(i % 4) * 80}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
