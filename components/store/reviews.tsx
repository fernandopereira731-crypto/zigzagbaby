import { Star } from 'lucide-react'
import { Reveal } from './reveal'

const reviews = [
  {
    name: 'Mariana Souza',
    role: 'Mamãe da Alice',
    text: 'Comprei um vestidinho e chegou no mesmo dia! Qualidade impecável e o atendimento foi super carinhoso. Virei cliente fiel.',
    initials: 'MS',
  },
  {
    name: 'Roberto Lima',
    role: 'Vovô do Théo',
    text: 'Precisava de um presente de última hora e fui muito bem atendido. As roupas são lindas e o tecido é macio de verdade.',
    initials: 'RL',
  },
  {
    name: 'Carla Mendes',
    role: 'Mamãe de gêmeos',
    text: 'Sempre encontro peças diferentes, confortáveis e com um precinho que cabe no bolso. Atendimento atencioso do início ao fim.',
    initials: 'CM',
  },
]

export function Reviews() {
  return (
    <section aria-labelledby="avaliacoes-titulo" className="bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        <Reveal className="mb-8 flex flex-col items-center gap-2 text-center">
          <span className="text-sm font-bold uppercase tracking-wide text-primary">
            Feito com carinho
          </span>
          <h2
            id="avaliacoes-titulo"
            className="text-balance font-serif text-3xl font-semibold text-foreground sm:text-4xl"
          >
            Avaliações de clientes
          </h2>
          <p className="mt-1 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
            Nossa loja está começando. Em breve, este espaço reunirá avaliações
            reais de quem comprou na Zig Zag Baby.
          </p>
          <span className="mt-2 inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            Conteúdo demonstrativo
          </span>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, i) => (
            <Reveal
              key={review.name}
              as="figure"
              delay={i * 100}
              className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="flex gap-0.5" aria-label="5 estrelas">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-accent text-accent"
                    aria-hidden="true"
                  />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-pretty text-sm leading-relaxed text-foreground">
                “{review.text}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                  {review.initials}
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-bold text-foreground">
                    {review.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {review.role}
                  </span>
                </span>
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
