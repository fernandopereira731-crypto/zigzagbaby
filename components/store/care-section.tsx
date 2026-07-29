import Image from 'next/image'
import { Check } from 'lucide-react'
import { Reveal } from './reveal'

const points = [
  'Tecidos macios que respeitam a pele do bebê',
  'Embalagem caprichada, perfeita para presentear',
  'Trocas fáceis e atendimento próximo de verdade',
]

export function CareSection() {
  return (
    <section aria-labelledby="carinho-titulo" className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-20">
        <div className="grid items-center gap-10 rounded-[2.5rem] border border-border bg-secondary/40 p-6 sm:p-10 lg:grid-cols-2 lg:gap-14 lg:p-14">
          <Reveal className="relative order-last overflow-hidden rounded-[2rem] border border-border bg-muted lg:order-first">
            <Image
              src="/images/cat-newborn.png"
              alt="Roupas de bebê dobradas com capricho em tons neutros"
              width={640}
              height={520}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </Reveal>

          <Reveal delay={120}>
            <span className="text-sm font-bold uppercase tracking-wide text-primary">
              Nosso jeito de cuidar
            </span>
            <h2
              id="carinho-titulo"
              className="mt-3 text-balance font-serif text-3xl font-semibold text-foreground sm:text-4xl"
            >
              Carinho em cada detalhe
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
              A Zig Zag Baby nasceu em Curvelo com um propósito simples: vestir a
              infância com conforto e beleza. Escolhemos cada peça pensando no
              bem-estar do seu pequeno e no sorriso de quem presenteia. Aqui,
              cada compra é tratada com o cuidado que sua família merece.
            </p>

            <ul className="mt-6 flex flex-col gap-3">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
