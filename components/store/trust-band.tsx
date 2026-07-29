import {
  HeartHandshake,
  Lock,
  RotateCcw,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import { Reveal } from './reveal'

const items = [
  { icon: Lock, label: 'Compra Segura' },
  { icon: Truck, label: 'Entrega Rápida' },
  { icon: RotateCcw, label: 'Troca Fácil' },
  { icon: ShieldCheck, label: 'Pagamento Seguro' },
  { icon: HeartHandshake, label: 'Atendimento Humanizado' },
]

export function TrustBand() {
  return (
    <section aria-label="Nossas garantias" className="bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item, i) => (
            <Reveal
              key={item.label}
              as="li"
              delay={i * 70}
              className="flex flex-col items-center gap-2 rounded-2xl bg-card/70 px-3 py-4 text-center transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-xs font-bold text-foreground sm:text-sm">
                {item.label}
              </span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
