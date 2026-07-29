'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'
import {
  TrendingUp,
  Receipt,
  DollarSign,
  Package,
  Download,
  Loader2,
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { formatBRL } from '@/lib/format'
import { Panel, GhostButton } from '../ui'
import {
  getReports,
  downloadCsv,
  type ReportsData,
} from '../reports-service'

const PERIODS = [
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
]

const PIE_COLORS = [
  'var(--chart-1)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-2)',
]

export function Reports() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getReports(days)
      .then((d) => {
        if (active) setData(d)
      })
      .catch((e) => {
        if (active) setError(e.message ?? 'Erro ao carregar relatórios.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [days])

  const kpis = useMemo(() => {
    const k = data?.kpis
    return [
      {
        label: 'Faturamento do período',
        value: formatBRL(k?.revenue ?? 0),
        icon: DollarSign,
        tone: 'text-whatsapp bg-whatsapp/10',
      },
      {
        label: 'Pedidos',
        value: String(k?.orders ?? 0),
        icon: Receipt,
        tone: 'text-primary bg-primary/10',
      },
      {
        label: 'Ticket médio',
        value: formatBRL(k?.avg_ticket ?? 0),
        icon: TrendingUp,
        tone: 'text-accent-foreground bg-accent/20',
      },
      {
        label: 'Itens vendidos',
        value: String(k?.items_sold ?? 0),
        icon: Package,
        tone: 'text-chart-5 bg-chart-5/10',
      },
    ]
  }, [data])

  const categoryData = useMemo(
    () =>
      (data?.by_category ?? []).map((c, i) => ({
        ...c,
        fill: PIE_COLORS[i % PIE_COLORS.length],
      })),
    [data],
  )

  const exportCsv = () => {
    if (!data) return
    const rows: (string | number)[][] = []
    rows.push(['KPIs do período', ''])
    rows.push(['Faturamento', data.kpis.revenue])
    rows.push(['Pedidos', data.kpis.orders])
    rows.push(['Ticket médio', data.kpis.avg_ticket])
    rows.push(['Itens vendidos', data.kpis.items_sold])
    rows.push(['', ''])
    rows.push(['Vendas por dia', ''])
    rows.push(['Dia', 'Faturamento', 'Pedidos'])
    data.sales_by_day.forEach((r) =>
      rows.push([r.label, r.revenue, r.orders]),
    )
    rows.push(['', ''])
    rows.push(['Produtos mais vendidos', ''])
    rows.push(['Produto', 'Unidades', 'Faturamento'])
    data.top_products.forEach((r) =>
      rows.push([r.name, r.quantity, r.revenue]),
    )
    rows.push(['', ''])
    rows.push(['Vendas por categoria', ''])
    rows.push(['Categoria', 'Faturamento'])
    data.by_category.forEach((r) => rows.push([r.name, r.revenue]))
    downloadCsv(
      `relatorio-${days}dias-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Relatório', 'Valor', 'Extra'],
      rows,
    )
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Panel className="p-6">
        <p className="text-sm text-secondary">{error}</p>
      </Panel>
    )
  }

  const hasData = (data?.kpis.orders ?? 0) > 0

  return (
    <div className="space-y-6">
      {/* Filtros + exportar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setDays(p.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                days === p.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <GhostButton type="button" onClick={exportCsv} disabled={!data}>
          <Download className="h-4 w-4" />
          Exportar CSV
        </GhostButton>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <Panel key={k.label} className="p-4">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${k.tone}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-xl font-extrabold text-foreground">
                {k.value}
              </p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </Panel>
          )
        })}
      </div>

      {!hasData ? (
        <Panel className="p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Ainda não há vendas registradas neste período para gerar gráficos.
          </p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Vendas por dia */}
          <ChartCard title="Faturamento por dia" subtitle={`Últimos ${days} dias`}>
            <ChartContainer
              config={{
                revenue: { label: 'Faturamento', color: 'var(--chart-1)' },
              }}
              className="h-64 w-full"
            >
              <AreaChart
                data={data?.sales_by_day}
                margin={{ left: 4, right: 8, top: 8 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                />
                <YAxis hide />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(v) => formatBRL(Number(v))}
                />
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="revenue"
                  type="monotone"
                  fill="url(#fillRevenue)"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </ChartCard>

          {/* Top produtos */}
          <ChartCard
            title="Produtos mais vendidos"
            subtitle="Unidades vendidas"
          >
            <ChartContainer
              config={{
                quantity: { label: 'Vendidos', color: 'var(--chart-3)' },
              }}
              className="h-64 w-full"
            >
              <BarChart
                data={data?.top_products}
                layout="vertical"
                margin={{ left: 8, right: 16 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={120}
                  tickMargin={4}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="quantity"
                  fill="var(--color-quantity)"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ChartContainer>
          </ChartCard>

          {/* Categorias */}
          {categoryData.length > 0 && (
            <ChartCard
              title="Vendas por categoria"
              subtitle="Participação no faturamento"
            >
              <ChartContainer config={{}} className="mx-auto h-64">
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent nameKey="name" />}
                    formatter={(v) => formatBRL(Number(v))}
                  />
                  <Pie
                    data={categoryData}
                    dataKey="revenue"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
                {categoryData.map((c) => (
                  <span
                    key={c.name}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: c.fill }}
                    />
                    {c.name}
                  </span>
                ))}
              </div>
            </ChartCard>
          )}

          {/* Novos clientes */}
          <ChartCard title="Novos clientes" subtitle="Cadastros por dia">
            <ChartContainer
              config={{
                customers: {
                  label: 'Novos clientes',
                  color: 'var(--chart-5)',
                },
              }}
              className="h-64 w-full"
            >
              <LineChart
                data={data?.new_customers}
                margin={{ left: 4, right: 8, top: 8 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  dataKey="customers"
                  type="monotone"
                  stroke="var(--color-customers)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: 'var(--color-customers)' }}
                />
              </LineChart>
            </ChartContainer>
          </ChartCard>
        </div>
      )}
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Panel className={`p-5 ${className ?? ''}`}>
      <div className="mb-4">
        <h3 className="font-serif text-lg font-semibold text-foreground">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </Panel>
  )
}
