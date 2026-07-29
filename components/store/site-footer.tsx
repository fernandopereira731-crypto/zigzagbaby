import { MapPin, Send } from 'lucide-react'
import { Logo } from './logo'
import { WhatsAppIcon } from './whatsapp-icon'
import { InstagramIcon, FacebookIcon } from './social-icons'
import { whatsappUrl, INSTAGRAM_URL, FACEBOOK_URL } from '@/lib/site'

const WHATSAPP_URL = whatsappUrl(
  'Olá! Quero conhecer as roupinhas da Zig Zag Baby.',
)

const shopLinks = [
  { label: 'Novidades', href: '/#produtos' },
  { label: 'Meninas', href: '/#categorias' },
  { label: 'Meninos', href: '/#categorias' },
  { label: 'Recém-nascido', href: '/#categorias' },
  { label: 'Unissex', href: '/#categorias' },
  { label: 'Promoções', href: '/#produtos' },
]

const helpLinks = [
  { label: 'Política de troca e devolução', href: '#trocas' },
  { label: 'Perguntas frequentes', href: '#faq' },
  { label: 'Guia de tamanhos', href: '#tamanhos' },
  { label: 'Entregas em Curvelo', href: '#entregas' },
]

const legalLinks = [
  { label: 'Política de Privacidade', href: '#privacidade' },
  { label: 'Termos de Uso', href: '#termos' },
  { label: 'Mapa do Site', href: '#mapa' },
]

const socials = [
  {
    label: 'Instagram',
    href: INSTAGRAM_URL,
    Icon: InstagramIcon,
  },
  { label: 'Facebook', href: FACEBOOK_URL, Icon: FacebookIcon },
  { label: 'WhatsApp', href: WHATSAPP_URL, Icon: WhatsAppIcon },
]

const payments = ['PIX', 'Visa', 'Master', 'Elo', 'Pix na entrega']

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      {/* Newsletter */}
      <div className="border-b border-border bg-primary/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-10 text-center lg:flex-row lg:justify-between lg:px-8 lg:text-left">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-foreground">
              Receba novidades e ofertas especiais
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Cadastre seu e-mail e ganhe carinho (e descontos) em primeira mão.
            </p>
          </div>
          <form className="flex w-full max-w-md flex-col gap-2.5 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              Seu melhor e-mail
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="Seu melhor e-mail"
              className="h-12 w-full rounded-full border border-border bg-card px-5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.03] active:scale-95"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              Cadastrar
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo />
            <p className="mt-4 font-serif text-lg font-semibold text-foreground">
              Moda infantil para momentos especiais
            </p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Peças selecionadas com carinho para oferecer conforto, qualidade e
              estilo em cada fase da infância.
            </p>
            <div className="mt-5 flex gap-3">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${label} da Zig Zag Baby`}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground">Comprar</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground">Ajuda</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {helpLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground">Atendimento</h3>
            <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span>
                Loja de roupas infantis
                <br />
                em Curvelo - MG
              </span>
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Falar no WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Formas de pagamento:
            </span>
            {payments.map((p) => (
              <span
                key={p}
                className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground"
              >
                {p}
              </span>
            ))}
          </div>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Zig Zag Baby. Todos os direitos
              reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
