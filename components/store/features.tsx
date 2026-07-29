import { CreditCard, HeartHandshake, Sparkles, Truck } from 'lucide-react'
import { Reveal } from './reveal'

const features = [
  {
    icon: Truck,
    title: 'Entrega no mesmo dia',
    description: 'Pedidos até 16h chegam hoje em Curvelo-MG.',
  },
  {
    icon: HeartHandshake,
    title: 'Atendimento humanizado',
    description: 'Ajudamos você a escolher com carinho e atenção.',
  },
  {
    icon: Sparkles,
    title: 'Peças de qualidade',
    description: 'Tecidos macios, confortáveis e duráveis.',
  },
  {
    icon: CreditCard,
    title: 'PIX e cartão',
    description: 'Pagamento fácil, seguro e do seu jeito.',
  },
]

export function Features() {
  return (
    <section aria-label="Nossos diferenciais" className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <Reveal
              key={feature.title}
              delay={i * 90}
              className="group flex flex-col items-start gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_40px_-24px_rgba(80,120,160,0.55)]"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-7 w-7" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-snug text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
