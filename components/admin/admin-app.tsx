'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  LayoutDashboard,
  ShoppingBag,
  Wallet,
  Package,
  Tags,
  Users,
  Ticket,
  Megaphone,
  BarChart3,
  Settings,
  UserCircle,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WhatsAppIcon } from '@/components/store/whatsapp-icon'
import { WHATSAPP_SUPPORT_URL } from './admin-data'
import { AdminLogin } from './admin-login'
import { AdminAuthProvider, useAdminAuth } from './auth/auth-context'
import { Dashboard } from './sections/dashboard'
import { Products } from './sections/products'
import { Orders } from './sections/orders'
import { Cash } from './sections/cash'
import { Categories } from './sections/categories'
import { Customers } from './sections/customers'
import { Coupons } from './sections/coupons'
import { Marketing } from './sections/marketing'
import { Reports } from './sections/reports'
import { SettingsSection } from './sections/settings'
import { AdminAccount } from './sections/account'

export type SectionId =
  | 'dashboard'
  | 'pedidos'
  | 'caixa'
  | 'produtos'
  | 'categorias'
  | 'clientes'
  | 'cupons'
  | 'marketing'
  | 'relatorios'
  | 'configuracoes'
  | 'conta'

const nav: { id: SectionId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
  { id: 'caixa', label: 'Caixa', icon: Wallet },
  { id: 'produtos', label: 'Produtos', icon: Package },
  { id: 'categorias', label: 'Categorias', icon: Tags },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'cupons', label: 'Cupons', icon: Ticket },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
  { id: 'conta', label: 'Minha Conta', icon: UserCircle },
]

const titles: Record<SectionId, string> = {
  dashboard: 'Dashboard',
  pedidos: 'Pedidos',
  caixa: 'Controle de Caixa',
  produtos: 'Produtos',
  categorias: 'Categorias',
  clientes: 'Clientes',
  cupons: 'Cupons',
  marketing: 'Marketing',
  relatorios: 'Relatórios',
  configuracoes: 'Configurações',
  conta: 'Minha Conta',
}

export function AdminApp() {
  return (
    <AdminAuthProvider>
      <AdminAppInner />
    </AdminAuthProvider>
  )
}

function AdminAppInner() {
  const { status, signOut, user } = useAdminAuth()
  const [active, setActive] = useState<SectionId>('dashboard')
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
          role="status"
          aria-label="Carregando"
        />
      </div>
    )
  }

  if (status !== 'authenticated') {
    return <AdminLogin />
  }

  function go(id: SectionId) {
    setActive(id)
    setDrawerOpen(false)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 })
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Sidebar - desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-background lg:flex">
        <div className="flex h-20 items-center border-b border-border px-6">
          <Image
            src="/images/logo.png"
            alt="Zig Zag Baby"
            width={741}
            height={672}
            className="h-11 w-auto"
          />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {nav.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={active === item.id}
              onClick={() => go(item.id)}
            />
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <a
            href={WHATSAPP_SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl bg-whatsapp/10 px-3 py-2.5 text-sm font-semibold text-whatsapp transition-colors hover:bg-whatsapp/20"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Suporte
          </a>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col bg-background shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Image
                src="/images/logo.png"
                alt="Zig Zag Baby"
                width={741}
                height={672}
                className="h-9 w-auto"
              />
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setDrawerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              {nav.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={active === item.id}
                  onClick={() => go(item.id)}
                />
              ))}
            </nav>
            <div className="border-t border-border p-4">
              <button
                type="button"
                onClick={() => signOut()}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted"
              >
                <LogOut className="h-5 w-5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md lg:h-20 lg:px-8">
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setDrawerOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="font-serif text-xl font-semibold text-foreground lg:text-2xl">
            {titles[active]}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              aria-label="Buscar"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted sm:flex"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Notificações"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-secondary" />
            </button>
            <div className="ml-1 flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {(user?.name ?? 'A').charAt(0).toUpperCase()}
              </span>
              <span className="hidden text-sm font-semibold text-foreground sm:block">
                {user?.name ?? 'Administrador'}
              </span>
            </div>
          </div>
        </header>

        <main className="p-4 pb-24 lg:p-8 lg:pb-8">
          {active === 'dashboard' && <Dashboard onNavigate={go} />}
          {active === 'pedidos' && <Orders />}
          {active === 'caixa' && <Cash />}
          {active === 'produtos' && <Products />}
          {active === 'categorias' && <Categories />}
          {active === 'clientes' && <Customers />}
          {active === 'cupons' && <Coupons />}
          {active === 'marketing' && <Marketing />}
          {active === 'relatorios' && <Reports />}
          {active === 'configuracoes' && <SettingsSection />}
          {active === 'conta' && <AdminAccount onLogout={() => signOut()} />}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-background/95 px-1 py-1.5 backdrop-blur-md lg:hidden">
        {nav.slice(0, 5).map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id)}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-semibold transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: { label: string; icon: typeof LayoutDashboard }
  active: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {item.label}
    </button>
  )
}
