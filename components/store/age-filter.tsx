import Link from 'next/link'
import { Reveal } from './reveal'

// A filtragem por idade depende do banco de dados. Por enquanto, os atalhos
// levam à seção de produtos em destaque na home.
const ages = [
  { label: 'RN', href: '#produtos' },
  { label: '0–3 meses', href: '#produtos' },
  { label: '3–6 meses', href: '#produtos' },
  { label: '6–12 meses', href: '#produtos' },
  { label: '1 ano', href: '#produtos' },
  { label: '2 anos', href: '#produtos' },
  { label: '3 anos', href: '#produtos' },
  { label: '4 anos', href: '#produtos' },
]

export function AgeFilter() {
  return (
    <section aria-labelledby="idade-title" className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <Reveal className="flex flex-col items-center text-center">
          <h2
            id="idade-title"
            className="font-serif text-2xl font-semibold text-foreground sm:text-3xl"
          >
            Escolha pela idade
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Encontre o tamanho perfeito em poucos toques.
          </p>
        </Reveal>

        <Reveal
          delay={120}
          className="mt-7 flex flex-wrap justify-center gap-2.5 sm:gap-3"
        >
          {ages.map((age) => (
            <Link
              key={age.label}
              href={age.href}
              className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md"
            >
              {age.label}
            </Link>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
