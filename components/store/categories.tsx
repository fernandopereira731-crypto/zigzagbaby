import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, LayoutGrid } from 'lucide-react'
import { getCategoriesWithCounts } from '@/lib/catalog-data'
import { Reveal } from './reveal'

// Imagem de capa por slug de categoria (o restante dos dados vem do banco).
const CATEGORY_IMAGES: Record<string, string> = {
  'recem-nascido': '/images/cat-newborn.png',
  meninas: '/images/cat-girls.png',
  meninos: '/images/cat-boys.png',
  unissex: '/images/cat-unisex.png',
  promocoes: '/images/cat-sale.png',
  calcados: '/images/cat-boys.png',
}

function pecasLabel(count: number) {
  return count === 1 ? '1 peça' : `${count} peças`
}

export async function Categories() {
  const all = await getCategoriesWithCounts()
  // Mostra apenas categorias que já possuem produtos ativos publicados.
  const categories = all.filter((c) => c.count > 0)

  return (
    <section
      id="categorias"
      aria-labelledby="categorias-titulo"
      className="scroll-mt-28 bg-background"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        <Reveal className="mb-8 flex flex-col gap-2 text-center sm:text-left">
          <span className="text-sm font-bold uppercase tracking-wide text-primary">
            Navegue por categorias
          </span>
          <h2
            id="categorias-titulo"
            className="text-balance font-serif text-3xl font-semibold text-foreground sm:text-4xl"
          >
            Para cada fase, uma roupinha especial
          </h2>
        </Reveal>

        {categories.length === 0 ? (
          <Reveal className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <LayoutGrid className="h-6 w-6" aria-hidden="true" />
            </span>
            <h3 className="font-serif text-xl font-semibold text-foreground">
              Categorias chegando em breve
            </h3>
            <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
              Estamos organizando o catálogo com muito carinho. Assim que os
              primeiros produtos forem publicados, eles aparecerão aqui.
            </p>
          </Reveal>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:grid-rows-2">
            {categories.map((category, i) => (
              <Reveal
                key={category.id}
                as="article"
                delay={i * 80}
                className={i === 0 ? 'lg:col-span-2 lg:row-span-2' : ''}
              >
                <Link
                  href="#produtos"
                  className="group relative flex min-h-44 items-end overflow-hidden rounded-3xl border border-border bg-muted shadow-sm transition-shadow duration-300 hover:shadow-[0_24px_50px_-28px_rgba(80,120,160,0.6)] lg:min-h-56 lg:h-full"
                >
                  <Image
                    src={CATEGORY_IMAGES[category.slug] || '/placeholder.svg'}
                    alt={`Categoria ${category.name}`}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/15 to-transparent"
                  />
                  <div className="relative flex w-full flex-col gap-3 p-4">
                    <div className="flex items-end justify-between">
                      <div className="text-background">
                        <h3 className="font-serif text-lg font-semibold sm:text-xl">
                          {category.name}
                        </h3>
                        <p className="text-xs font-medium text-background/85">
                          {pecasLabel(category.count)}
                        </p>
                      </div>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-45">
                        <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </div>
                    <span className="inline-flex w-fit items-center rounded-full bg-card/95 px-4 py-1.5 text-xs font-bold text-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 sm:translate-y-2 sm:group-hover:translate-y-0">
                      Ver categoria
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
