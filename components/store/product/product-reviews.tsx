import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal } from '../reveal'

type Review = {
  name: string
  initials: string
  rating: number
  date: string
  product: string
  text: string
}

const reviews: Review[] = [
  {
    name: 'Mariana Souza',
    initials: 'MS',
    rating: 5,
    date: '02 de julho de 2026',
    product: 'Vestido Floral Primavera · Tam. 2',
    text: 'Chegou no mesmo dia! O tecido é super macio e a estampa é ainda mais linda pessoalmente. Minha filha amou e ficou confortável o dia todo.',
  },
  {
    name: 'Patrícia Andrade',
    initials: 'PA',
    rating: 5,
    date: '28 de junho de 2026',
    product: 'Vestido Floral Primavera · Tam. 1',
    text: 'Comprei para presente e foi um sucesso. Acabamento impecável e o vestido não desbotou depois de várias lavagens. Recomendo demais!',
  },
  {
    name: 'Juliana Reis',
    initials: 'JR',
    rating: 4,
    date: '20 de junho de 2026',
    product: 'Vestido Floral Primavera · Tam. P',
    text: 'Muito fofo e de ótima qualidade. Achei que ficou um pouquinho largo, mas nada que atrapalhasse. Atendimento nota mil pelo WhatsApp.',
  },
  {
    name: 'Fernanda Costa',
    initials: 'FC',
    rating: 5,
    date: '15 de junho de 2026',
    product: 'Vestido Floral Primavera · Tam. M',
    text: 'Simplesmente perfeito. Delicado, confortável e com um preço justo. Já virei cliente fiel da Zig Zag Baby.',
  },
]

const distribution = [
  { stars: 5, pct: 86 },
  { stars: 4, pct: 11 },
  { stars: 3, pct: 2 },
  { stars: 2, pct: 1 },
  { stars: 1, pct: 0 },
]

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={cn('flex', className)} aria-label={`${rating} de 5 estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-4 w-4',
            i < rating ? 'fill-accent text-accent' : 'fill-muted text-muted',
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export function ProductReviews() {
  return (
    <section aria-labelledby="avaliacoes-produto-titulo" className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        <Reveal className="mb-8">
          <span className="text-sm font-bold uppercase tracking-wide text-primary">
            Opinião de quem comprou
          </span>
          <h2
            id="avaliacoes-produto-titulo"
            className="mt-2 scroll-mt-28 text-balance font-serif text-3xl font-semibold text-foreground sm:text-4xl"
          >
            Avaliações do produto
          </h2>
          <span className="mt-3 inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            Conteúdo demonstrativo
          </span>
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          {/* Summary */}
          <Reveal className="h-fit rounded-3xl border border-border bg-card p-6">
            <div className="flex flex-col items-center text-center">
              <span className="font-serif text-5xl font-bold text-foreground">4.9</span>
              <Stars rating={5} className="mt-2" />
              <span className="mt-1 text-sm text-muted-foreground">Exemplo demonstrativo</span>
            </div>
            <ul className="mt-6 flex flex-col gap-2">
              {distribution.map((d) => (
                <li key={d.stars} className="flex items-center gap-2 text-sm">
                  <span className="flex w-8 items-center gap-0.5 font-semibold text-foreground">
                    {d.stars}
                    <Star className="h-3 w-3 fill-accent text-accent" aria-hidden="true" />
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${d.pct}%` }}
                    />
                  </span>
                  <span className="w-9 text-right text-xs text-muted-foreground">{d.pct}%</span>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Review list */}
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((review, i) => (
              <Reveal
                key={review.name}
                as="figure"
                delay={i * 80}
                className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <Stars rating={review.rating} />
                  <span className="text-xs text-muted-foreground">{review.date}</span>
                </div>
                <blockquote className="mt-3 flex-1 text-pretty text-sm leading-relaxed text-foreground">
                  “{review.text}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                    {review.initials}
                  </span>
                  <span className="leading-tight">
                    <span className="block text-sm font-bold text-foreground">{review.name}</span>
                    <span className="block text-xs text-muted-foreground">{review.product}</span>
                  </span>
                </figcaption>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
