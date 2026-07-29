'use client'

import { useEffect, useState } from 'react'
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Users,
  Receipt,
  Flame,
  Clock,
  Truck,
  XCircle,
  ArrowUpRight,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { formatBRL } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Panel, StatusBadge } from '../ui'
import { getDashboardData, type DashboardData } from '../products-service'
import { useAdminAuth } from '../auth/auth-context'
import type { SectionId } from '../admin-app'

type Metric = {
  label: string
  value: string
  icon: typeof ShoppingBag
  tone: string
  trend?: string
  alert?: boolean
}

const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-accent/25 text-accent-foreground' },
  pendente: { label: 'Pendente', className: 'bg-accent/25 text-accent-foreground' },
  paid: { label: 'Pago', className: 'bg-primary/15 text-primary' },
  pago: { label: 'Pago', className: 'bg-primary/15 text-primary' },
  processing: { label: 'Processando', className: 'bg-primary/15 text-primary' },
  shipped: { label: 'Enviado', className: 'bg-chart-5/15 text-chart-5' },
  enviado: { label: 'Enviado', className: 'bg-chart-5/15 text-chart-5' },
  delivered: { label: 'Entregue', className: 'bg-whatsapp/15 text-whatsapp' },
  entregue: { label: 'Entregue', className: 'bg-whatsapp/15 text-whatsapp' },
  canceled: { label: 'Cancelado', className: 'bg-secondary text-secondary-foreground' },
  cancelled: { label: 'Cancelado', className: 'bg-secondary text-secondary-foreground' },
  cancelado: { label: 'Cancelado', className: 'bg-secondary text-secondary-foreground' },
}

function orderStatusLabel(status: string) {
  return (
    ORDER_STATUS[status] ?? {
      label: status,
      className: 'bg-muted text-muted-foreground',
    }
  )
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

const todayLabel = new Date().toLocaleDateString('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

export function Dashboard({
  onNavigate,
}: {
  onNavigate: (id: SectionId) => void
}) {
  const { user } = useAdminAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await getDashboardData()
        if (active) setData(result)
      } catch (err) {
        if (active)
          setError(
            err instanceof Error ? err.message : 'Erro ao carregar métricas.',
          )
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const firstName = user?.name?.split(' ')[0] ?? 'administrador'

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Carregando painel...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <AlertCircle className="h-6 w-6" />
        </span>
        <p className="text-sm font-semibold text-foreground">
          {error ?? 'Não foi possível carregar o painel.'}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <RefreshCw className="h-4 w-4" /> Recarregar
        </button>
      </div>
    )
  }

  const cards: Metric[] = [
    {
      label: 'Pedidos hoje',
      value: String(data.ordersToday),
      icon: ShoppingBag,
      tone: 'text-primary bg-primary/10',
    },
    {
      label: 'Vendas hoje',
      value: formatBRL(data.salesToday),
      icon: DollarSign,
      tone: 'text-whatsapp bg-whatsapp/10',
    },
    {
      label: 'Faturamento do mês',
      value: formatBRL(data.monthRevenue),
      icon: TrendingUp,
      tone: 'text-chart-5 bg-chart-5/10',
    },
    {
      label: 'Ticket médio',
      value: formatBRL(data.averageTicket),
      icon: Receipt,
      tone: 'text-accent-foreground bg-accent/20',
    },
    {
      label: 'Produtos ativos',
      value: String(data.activeProducts),
      icon: Package,
      tone: 'text-primary bg-primary/10',
    },
    {
      label: 'Estoque baixo',
      value: String(data.lowStock),
      icon: AlertTriangle,
      tone: 'text-secondary-foreground bg-secondary',
      alert: data.lowStock > 0,
    },
    {
      label: 'Clientes cadastrados',
      value: String(data.customers),
      icon: Users,
      tone: 'text-chart-5 bg-chart-5/10',
    },
    {
      label: 'Total de produtos',
      value: String(data.totalProducts),
      icon: Flame,
      tone: 'text-secondary-foreground bg-secondary',
    },
  ]

  const orderStatusCards = [
    {
      label: 'Pedidos pendentes',
      value: data.pendingOrders,
      icon: Clock,
      tone: 'text-accent-foreground bg-accent/20',
    },
    {
      label: 'Pedidos enviados',
      value: data.shippedOrders,
      icon: Truck,
      tone: 'text-primary bg-primary/10',
    },
    {
      label: 'Pedidos cancelados',
      value: data.canceledOrders,
      icon: XCircle,
      tone: 'text-secondary-foreground bg-secondary',
    },
  ]

  const maxSold = Math.max(1, ...data.topProducts.map((p) => p.sold))

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="font-serif text-2xl font-semibold text-foreground lg:text-3xl">
          {greeting()}, {firstName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Aqui está o resumo da sua loja hoje, {todayLabel}.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Panel key={c.label} className="p-4">
              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl',
                    c.tone,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {c.trend ? (
                  <span className="flex items-center gap-0.5 text-xs font-bold text-whatsapp">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {c.trend}
                  </span>
                ) : c.alert ? (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                    Atenção
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-2xl font-extrabold text-foreground">
                {c.value}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                {c.label}
              </p>
            </Panel>
          )
        })}
      </div>

      {/* Order status */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {orderStatusCards.map((c) => {
          const Icon = c.icon
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => onNavigate('pedidos')}
              className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4 text-left shadow-sm transition-colors hover:border-primary/40"
            >
              <span
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  c.tone,
                )}
              >
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-2xl font-extrabold text-foreground">
                  {c.value}
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  {c.label}
                </p>
              </div>
              <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Top products */}
        <Panel className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-foreground">
              Produtos mais vendidos
            </h3>
            <Flame className="h-5 w-5 text-secondary-foreground" />
          </div>
          {data.topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Ainda não há vendas registradas.
            </p>
          ) : (
            <ul className="space-y-4">
              {data.topProducts.map((p, i) => (
                <li key={p.name}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {i + 1}
                      </span>
                      {p.name}
                    </span>
                    <span className="font-bold text-foreground">{p.sold}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(p.sold / maxSold) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Recent orders */}
        <Panel className="lg:col-span-3">
          <div className="flex items-center justify-between border-b border-border p-5">
            <h3 className="font-serif text-lg font-semibold text-foreground">
              Pedidos recentes
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('pedidos')}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Ver todos
            </button>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Nenhum pedido recebido ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {data.recentOrders.map((o) => {
                const st = orderStatusLabel(o.status)
                return (
                  <li
                    key={o.id}
                    className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">
                        {o.id}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {o.customer} · {o.city}
                      </p>
                    </div>
                    <StatusBadge label={st.label} className={st.className} />
                    <span className="w-20 text-right text-sm font-bold text-foreground">
                      {formatBRL(o.total)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
