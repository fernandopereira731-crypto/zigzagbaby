'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  RefreshCw,
  Truck,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { WhatsAppIcon } from '@/components/store/whatsapp-icon'
import { AuthView } from './auth-view'
import {
  AddressesPanel,
  FavoritesPanel,
  OrdersPanel,
  OverviewPanel,
  ProfilePanel,
  ReturnsPanel,
  TrackingPanel,
  type PanelKey,
} from './account-panels'
import { WHATSAPP_URL, type Order } from './account-data'
import { fetchMyOrders } from './account-orders-service'
import {
  fetchProfile,
  flushPendingChildren,
  type Profile,
} from './account-service'

const NAV: {
  key: PanelKey
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { key: 'overview', label: 'Painel', icon: LayoutDashboard },
  { key: 'orders', label: 'Pedidos', icon: Package },
  { key: 'favorites', label: 'Favoritos', icon: Heart },
  { key: 'addresses', label: 'Endereços', icon: MapPin },
  { key: 'profile', label: 'Dados', icon: User },
  { key: 'returns', label: 'Trocas', icon: RefreshCw },
  { key: 'tracking', label: 'Entrega', icon: Truck },
]

type Status = 'loading' | 'guest' | 'authed'

export function AccountClient() {
  const [status, setStatus] = useState<Status>('loading')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [panel, setPanel] = useState<PanelKey>('overview')
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)

  const loadAccount = useCallback(async () => {
    setOrdersLoading(true)
    setOrdersError(null)
    try {
      // Persiste crianças informadas no cadastro (caso a confirmação de
      // e-mail estivesse ativa e não houvesse sessão no momento do cadastro).
      await flushPendingChildren()
      const [prof, ords] = await Promise.all([fetchProfile(), fetchMyOrders()])
      setProfile(prof)
      setOrders(ords)
    } catch (err) {
      setOrdersError(
        err instanceof Error ? err.message : 'Erro ao carregar seus dados.',
      )
    } finally {
      setOrdersLoading(false)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return
      if (user) {
        setStatus('authed')
        void loadAccount()
      } else {
        setStatus('guest')
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (session?.user) {
        setStatus('authed')
        void loadAccount()
      } else if (event === 'SIGNED_OUT') {
        setStatus('guest')
        setProfile(null)
        setOrders([])
        setPanel('overview')
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [loadAccount])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
  }

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-md px-4 py-24">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Carregando sua conta...
        </p>
      </div>
    )
  }

  if (status === 'guest') {
    return <AuthView onAuthenticated={() => void loadAccount()} />
  }

  const firstName = profile?.firstName || profile?.fullName?.split(' ')[0] || ''
  const displayName = profile?.fullName || firstName || 'Cliente'
  const email = profile?.email || ''
  const since = profile?.createdAt
    ? new Date(profile.createdAt).getFullYear().toString()
    : ''

  function renderPanel() {
    switch (panel) {
      case 'overview':
        return (
          <OverviewPanel
            onNavigate={setPanel}
            orders={orders}
            firstName={firstName}
            since={since}
          />
        )
      case 'orders':
        return (
          <OrdersPanel
            onTrack={() => setPanel('tracking')}
            orders={orders}
            loading={ordersLoading}
            error={ordersError}
          />
        )
      case 'favorites':
        return <FavoritesPanel />
      case 'addresses':
        return <AddressesPanel />
      case 'profile':
        return <ProfilePanel profile={profile} onSaved={() => void loadAccount()} />
      case 'returns':
        return <ReturnsPanel />
      case 'tracking':
        return <TrackingPanel orders={orders} />
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 lg:px-8 lg:py-10">
      {/* Mobile greeting */}
      <div className="mb-4 flex items-center gap-3 lg:hidden">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
          {firstName.charAt(0) || 'Z'}
        </span>
        <div>
          <p className="text-sm text-muted-foreground">Bem-vinda,</p>
          <p className="font-serif text-lg font-semibold text-foreground">
            {firstName || 'Cliente'}
          </p>
        </div>
      </div>

      {/* Mobile horizontal nav (app-like) */}
      <nav
        aria-label="Navegação da conta"
        className="mb-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {NAV.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setPanel(item.key)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
              panel === item.key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground hover:bg-muted',
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {firstName.charAt(0) || 'Z'}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">
                  {displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {email}
                </p>
              </div>
            </div>

            <nav className="flex flex-col gap-1 rounded-3xl border border-border bg-card p-2">
              {NAV.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPanel(item.key)}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors',
                    panel === item.key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted',
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
              >
                <LogOut className="h-5 w-5" />
                Sair
              </button>
            </nav>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-whatsapp text-sm font-bold text-whatsapp-foreground transition-transform hover:brightness-105 active:scale-[0.99]"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Suporte no WhatsApp
            </a>
          </div>
        </aside>

        {/* Panel content */}
        <section className="min-w-0">{renderPanel()}</section>
      </div>

      {/* Mobile logout */}
      <div className="mt-6 lg:hidden">
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-card text-sm font-bold text-muted-foreground transition-colors hover:bg-muted"
        >
          <LogOut className="h-4 w-4" />
          Sair da conta
        </button>
      </div>

      {/* Mobile floating WhatsApp support */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Suporte no WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-lg transition-transform active:scale-95 lg:hidden"
      >
        <WhatsAppIcon className="h-6 w-6" />
      </a>
    </div>
  )
}
