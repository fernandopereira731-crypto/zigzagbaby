'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react'
import { Logo } from './logo'
import { WhatsAppIcon } from './whatsapp-icon'
import { cn } from '@/lib/utils'
import { whatsappUrl } from '@/lib/site'
import { useStore } from './store-context'

const WHATSAPP_URL = whatsappUrl('Olá, vim pela Zig Zag Baby!')

const navLinks = [
  { label: 'Início', href: '/' },
  { label: 'Novidades', href: '/#produtos' },
  { label: 'Meninas', href: '/#categorias' },
  { label: 'Meninos', href: '/#categorias' },
  { label: 'Recém-nascido', href: '/#categorias' },
  { label: 'Unissex', href: '/#categorias' },
  { label: 'Promoções', href: '/#produtos', highlight: true },
]

function IconAction({
  label,
  count,
  href,
  children,
}: {
  label: string
  count?: number
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-all hover:bg-secondary hover:scale-105 active:scale-95"
    >
      {children}
      {count !== undefined && count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { cartCount, favoritesCount } = useStore()
  const router = useRouter()
  const [query, setQuery] = useState('')

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const term = query.trim()
    if (!term) return
    setMobileOpen(false)
    router.push(`/buscar?q=${encodeURIComponent(term)}`)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 lg:gap-5 lg:px-8">
        <Link
          href="/"
          className="group shrink-0"
          aria-label="Zig Zag Baby, página inicial"
        >
          <Logo />
        </Link>

        {/* Search - desktop */}
        <div className="hidden flex-1 md:block">
          <form role="search" className="relative w-full" onSubmit={submitSearch}>
            <Search
              className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar roupinhas, tamanhos, cores..."
              aria-label="Buscar produtos"
              className="h-12 w-full rounded-full border border-border bg-card pl-12 pr-28 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-transform hover:scale-105 active:scale-95"
            >
              Buscar
            </button>
          </form>
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <div className="hidden items-center gap-1 sm:flex">
            <IconAction label="Minha conta" href="/conta">
              <User className="h-5 w-5" aria-hidden="true" />
            </IconAction>
            <IconAction
              label={
                favoritesCount > 0
                  ? `Favoritos, ${favoritesCount} itens`
                  : 'Favoritos'
              }
              count={favoritesCount}
              href="/conta"
            >
              <Heart className="h-5 w-5" aria-hidden="true" />
            </IconAction>
          </div>
          <IconAction
            label={
              cartCount > 0 ? `Carrinho, ${cartCount} itens` : 'Carrinho'
            }
            count={cartCount}
            href="/carrinho"
          >
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          </IconAction>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Falar no WhatsApp"
            className="ml-1 hidden h-11 items-center gap-2 rounded-full bg-whatsapp px-4 text-sm font-bold text-whatsapp-foreground shadow-sm transition-transform hover:scale-105 active:scale-95 sm:flex"
          >
            <WhatsAppIcon className="h-5 w-5" />
            <span className="hidden lg:inline">WhatsApp</span>
          </a>

          <button
            type="button"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Search - mobile */}
      <div className="border-t border-border px-4 py-2.5 md:hidden">
        <form role="search" className="relative" onSubmit={submitSearch}>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar roupinhas..."
            aria-label="Buscar produtos"
            className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </form>
      </div>

      {/* Nav - desktop */}
      <nav
        aria-label="Categorias principais"
        className="hidden border-t border-border bg-background lg:block"
      >
        <ul className="mx-auto flex max-w-7xl items-center gap-1 px-4 lg:px-8">
          {navLinks.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className={cn(
                  'relative inline-flex items-center px-4 py-3 text-sm font-semibold transition-colors after:absolute after:bottom-1.5 after:left-4 after:right-4 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform hover:after:scale-x-100',
                  link.highlight
                    ? 'text-secondary-foreground hover:text-primary'
                    : 'text-foreground/80 hover:text-primary',
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Nav - mobile */}
      {mobileOpen && (
        <nav
          aria-label="Categorias principais"
          className="border-t border-border bg-background lg:hidden"
        >
          <ul className="mx-auto flex max-w-7xl flex-col px-2 py-2">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center rounded-xl px-4 py-3 text-sm font-semibold text-foreground/90 transition-colors hover:bg-secondary hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-1 flex flex-col gap-2 border-t border-border px-2 pt-3">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-whatsapp px-3 py-2.5 text-sm font-bold text-whatsapp-foreground"
              >
                <WhatsAppIcon className="h-4 w-4" /> Falar no WhatsApp
              </a>
              <div className="flex gap-2 sm:hidden">
                <Link
                  href="/conta"
                  onClick={() => setMobileOpen(false)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold text-foreground"
                >
                  <User className="h-4 w-4" /> Conta
                </Link>
                <Link
                  href="/conta"
                  onClick={() => setMobileOpen(false)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold text-foreground"
                >
                  <Heart className="h-4 w-4" /> Favoritos
                </Link>
              </div>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
