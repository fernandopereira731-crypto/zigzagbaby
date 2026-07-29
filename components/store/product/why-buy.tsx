import { HeartHandshake, Sparkles, Truck, ShieldCheck } from 'lucide-react'
import { Reveal } from '../reveal'

const reasons = [
  {
    icon: HeartHandshake,
    title: 'Atendimento humanizado',
    text: 'Gente de verdade pronta para ajudar você a escolher com carinho.',
  },
  {
    icon: Sparkles,
    title: 'Carinho em cada detalhe',
    text: 'Peças pensadas no conforto e no bem-estar dos pequenos.',
  },
  {
    icon: Truck,
    title: 'Entrega rápida',
    text: 'Receba hoje em Curvelo para pedidos confirmados até as 16h.',
  },
  {
    icon: ShieldCheck,
    title: 'Compra segura',
    text: 'Pagamento protegido, troca fácil e total tranquilidade.',
  },
]

export function WhyBuy() {
  return (
    <section aria-labelledby="porque-comprar-titulo" className="bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        <Reveal className="mx-auto mb-8 max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wide text-primary">
            Confiança e cuidado
          </span>
          <h2
            id="porque-comprar-titulo"
            className="mt-2 text-balance font-serif text-3xl font-semibold text-foreground sm:text-4xl"
          >
            Por que comprar na Zig Zag Baby?
          </h2>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason, i) => (
            <Reveal
              key={reason.title}
              delay={i * 90}
              className="flex flex-col items-center rounded-3xl border border-border bg-card p-6 text-center shadow-sm transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <reason.icon className="h-7 w-7" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-bold text-foreground">
                {reason.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                {reason.text}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
