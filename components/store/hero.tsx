import Image from 'next/image'
import { ArrowRight, Heart, Star, Truck } from 'lucide-react'
import { WhatsAppIcon } from './whatsapp-icon'
import { whatsappUrl } from '@/lib/site'

const WHATSAPP_URL = whatsappUrl(
  'Olá! Quero conhecer as roupinhas da Zig Zag Baby.',
)

export function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden bg-background">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-20">
        <div className="flex flex-col items-start">
          <span className="zzb-animate-fade-up inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground [animation-delay:60ms]">
            <Star className="h-4 w-4 fill-current" aria-hidden="true" />
            Loja de roupas infantis em Curvelo-MG
          </span>

          <h1 className="zzb-animate-fade-up mt-6 text-balance font-serif text-4xl font-semibold leading-tight tracking-tight text-foreground [animation-delay:140ms] sm:text-5xl lg:text-[3.5rem]">
            Carinho em cada detalhe para quem você mais ama.
          </h1>

          <p className="zzb-animate-fade-up mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground [animation-delay:240ms] sm:text-lg">
            Peças bonitas, confortáveis e escolhidas para acompanhar os momentos
            mais especiais da infância.
          </p>

          {/* Institutional badge */}
          <div className="zzb-animate-fade-up mt-6 inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-foreground [animation-delay:320ms]">
            <Heart className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
            Roupinhas escolhidas com carinho para acompanhar cada fase da
            infância.
          </div>

          <div className="zzb-animate-fade-up mt-8 flex w-full flex-col gap-3 [animation-delay:400ms] sm:flex-row sm:items-center">
            <a
              href="#produtos"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-9 py-4 text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.03] hover:brightness-105 active:scale-[0.98]"
            >
              Comprar agora
              <ArrowRight
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp px-7 py-4 text-base font-bold text-whatsapp-foreground shadow-sm transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Falar no WhatsApp
            </a>
          </div>

          <div className="mt-8 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Truck className="h-4 w-4 text-primary" aria-hidden="true" />
            Entrega no mesmo dia em Curvelo para pedidos até 16h
          </div>
        </div>

        <div className="zzb-animate-fade-in relative [animation-delay:200ms]">
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-muted shadow-[0_24px_60px_-30px_rgba(80,120,160,0.4)]">
            <Image
              src="/images/hero-baby.png"
              alt="Duas crianças pequenas sorrindo juntas, vestindo roupas infantis delicadas em tons pastéis"
              width={720}
              height={720}
              priority
              className="h-full w-full object-cover"
            />
          </div>

          {/* floating badge */}
          <div className="absolute -bottom-5 left-5 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg sm:left-8">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Star className="h-5 w-5 fill-current" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-foreground">Atendimento humanizado</p>
              <p className="text-xs text-muted-foreground">Carinho em cada pedido.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
