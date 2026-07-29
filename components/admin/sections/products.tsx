'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import {
  Plus,
  Pencil,
  Copy,
  Trash2,
  Package,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
  PackageX,
  PackageMinus,
  Percent,
  Wallet,
  Flame,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { formatBRL } from '@/lib/format'
import { cn } from '@/lib/utils'
import { brands, allSizes, productStatusLabels } from '../admin-data'
import {
  listProducts,
  listCategories,
  deleteProduct,
  duplicateProduct,
  type AdminProductRow,
  type AdminCategory,
} from '../products-service'
import {
  Panel,
  StatusBadge,
  SearchInput,
  Select,
  PrimaryButton,
  IconAction,
} from '../ui'
import { ProductForm } from './product-form'

export function Products() {
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [items, setItems] = useState<AdminProductRow[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [size, setSize] = useState('')
  const [status, setStatus] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [prods, cats] = await Promise.all([
        listProducts(),
        listCategories(),
      ])
      setItems(prods)
      setCategories(cats)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao carregar produtos.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (view === 'list') load()
  }, [view, load])

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (query && !p.name.toLowerCase().includes(query.toLowerCase()))
        return false
      if (category && p.category !== category) return false
      if (brand && p.brand !== brand) return false
      if (size && !p.sizes.includes(size)) return false
      if (status && p.status !== status) return false
      return true
    })
  }, [items, query, category, brand, size, status])

  // Indicadores (KPIs) calculados sobre a lista completa de produtos.
  const kpis = useMemo(() => {
    const total = items.length
    const outOfStock = items.filter((p) => p.stock === 0).length
    const lowStock = items.filter((p) => p.lowStock).length
    const withCost = items.filter((p) => p.cost > 0)
    const avgMarginPercent = withCost.length
      ? withCost.reduce((s, p) => s + p.marginPercent, 0) / withCost.length
      : 0
    const stockCostValue = items.reduce((s, p) => s + p.cost * p.stock, 0)
    return { total, outOfStock, lowStock, avgMarginPercent, stockCostValue }
  }, [items])

  // Exporta a lista filtrada para um arquivo Excel (.xlsx) real.
  function handleExportExcel() {
    const rows = filtered.map((p) => ({
      Produto: p.name,
      Categoria: p.category,
      Marca: p.brand,
      'Preço (R$)': p.price,
      'Preço efetivo (R$)': p.effectivePrice,
      'Custo (R$)': p.cost,
      'Margem (R$)': p.margin,
      'Margem (%)': Number(p.marginPercent.toFixed(1)),
      Estoque: p.stock,
      'Alerta estoque': p.lowStockThreshold,
      Tamanhos: p.sizes.join(', '),
      'Mais vendido': p.bestSeller ? 'Sim' : 'Não',
      Status: productStatusLabels[p.status].label,
    }))
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos')
    const today = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(workbook, `produtos-${today}.xlsx`)
  }

  function openNew() {
    setEditingId(null)
    setView('form')
  }

  function openEdit(id: string) {
    setEditingId(id)
    setView('form')
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`))
      return
    setBusyId(id)
    setError(null)
    try {
      await deleteProduct(id)
      setItems((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir produto.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDuplicate(id: string) {
    setBusyId(id)
    setError(null)
    try {
      await duplicateProduct(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao duplicar produto.')
    } finally {
      setBusyId(null)
    }
  }

  if (view === 'form') {
    return (
      <ProductForm
        editingId={editingId}
        onBack={() => {
          setEditingId(null)
          setView('list')
        }}
      />
    )
  }

  return (
    <div className="space-y-5">
      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard
          icon={<Package className="h-4 w-4" />}
          label="Produtos"
          value={String(kpis.total)}
        />
        <KpiCard
          icon={<PackageX className="h-4 w-4" />}
          label="Sem estoque"
          value={String(kpis.outOfStock)}
          tone={kpis.outOfStock > 0 ? 'danger' : 'default'}
        />
        <KpiCard
          icon={<PackageMinus className="h-4 w-4" />}
          label="Estoque baixo"
          value={String(kpis.lowStock)}
          tone={kpis.lowStock > 0 ? 'warning' : 'default'}
        />
        <KpiCard
          icon={<Percent className="h-4 w-4" />}
          label="Margem média"
          value={`${kpis.avgMarginPercent.toFixed(1)}%`}
        />
        <KpiCard
          icon={<Wallet className="h-4 w-4" />}
          label="Custo em estoque"
          value={formatBRL(kpis.stockCostValue)}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            placeholder="Pesquisar produto..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={filtered.length === 0}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-input bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </button>
          <PrimaryButton className="shrink-0" onClick={openNew}>
            <Plus className="h-4 w-4" />
            Novo produto
          </PrimaryButton>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">Marca</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
          <Select value={size} onChange={(e) => setSize(e.target.value)}>
            <option value="">Tamanho</option>
            {allSizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="esgotado">Esgotado</option>
          </Select>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-secondary bg-secondary/40 px-4 py-3 text-sm text-secondary-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1 font-semibold hover:underline"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Carregando produtos...</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <Panel className="hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Produto</th>
                  <th className="px-4 py-3 font-semibold">Categoria</th>
                  <th className="px-4 py-3 font-semibold">Preço</th>
                  <th className="px-4 py-3 font-semibold">Custo</th>
                  <th className="px-4 py-3 font-semibold">Margem</th>
                  <th className="px-4 py-3 font-semibold">Estoque</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                          <Image
                            src={p.image || '/placeholder.svg'}
                            alt={p.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-foreground">
                              {p.name}
                            </p>
                            {p.bestSeller && <BestSellerBadge />}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {p.brand}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.category}
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground">
                      {formatBRL(p.price)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.cost > 0 ? formatBRL(p.cost) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <MarginCell
                        cost={p.cost}
                        margin={p.margin}
                        marginPercent={p.marginPercent}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StockBadge
                        stock={p.stock}
                        threshold={p.lowStockThreshold}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={productStatusLabels[p.status].label}
                        className={productStatusLabels[p.status].className}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {busyId === p.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <IconAction
                              label="Editar"
                              onClick={() => openEdit(p.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </IconAction>
                            <IconAction
                              label="Duplicar"
                              onClick={() => handleDuplicate(p.id)}
                            >
                              <Copy className="h-4 w-4" />
                            </IconAction>
                            <IconAction
                              label="Excluir"
                              onClick={() => handleDelete(p.id, p.name)}
                              className="hover:bg-secondary hover:text-secondary-foreground"
                            >
                              <Trash2 className="h-4 w-4" />
                            </IconAction>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <EmptyRow hasProducts={items.length > 0} />}
          </Panel>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((p) => (
              <Panel key={p.id} className="p-3">
                <div className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    <Image
                      src={p.image || '/placeholder.svg'}
                      alt={p.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <p className="truncate font-semibold text-foreground">
                          {p.name}
                        </p>
                        {p.bestSeller && <BestSellerBadge />}
                      </div>
                      <StatusBadge
                        label={productStatusLabels[p.status].label}
                        className={productStatusLabels[p.status].className}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {p.category} · {p.brand}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="font-bold text-foreground">
                        {formatBRL(p.price)}
                      </span>
                      <StockBadge stock={p.stock} threshold={p.lowStockThreshold} />
                    </div>
                    {p.cost > 0 && (
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Custo {formatBRL(p.cost)}
                        </span>
                        <span
                          className={
                            p.margin >= 0
                              ? 'font-semibold text-emerald-600'
                              : 'font-semibold text-destructive'
                          }
                        >
                          Margem {formatBRL(p.margin)} ({p.marginPercent.toFixed(0)}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                  <button
                    onClick={() => openEdit(p.id)}
                    disabled={busyId === p.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => handleDuplicate(p.id)}
                    disabled={busyId === p.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    <Copy className="h-3.5 w-3.5" /> Duplicar
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    disabled={busyId === p.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </button>
                </div>
              </Panel>
            ))}
            {filtered.length === 0 && (
              <Panel className="py-12">
                <EmptyRow hasProducts={items.length > 0} />
              </Panel>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {filtered.length} de {items.length} produtos
          </p>
        </>
      )}
    </div>
  )
}

function StockBadge({
  stock,
  threshold = 5,
}: {
  stock: number
  threshold?: number
}) {
  const isLow = stock > 0 && stock <= threshold
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm font-semibold',
        stock === 0
          ? 'text-secondary-foreground'
          : isLow
            ? 'text-accent-foreground'
            : 'text-foreground',
      )}
    >
      {stock} un.
      {isLow && (
        <span className="rounded-full bg-accent/25 px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
          baixo
        </span>
      )}
    </span>
  )
}

function MarginCell({
  cost,
  margin,
  marginPercent,
}: {
  cost: number
  margin: number
  marginPercent: number
}) {
  if (cost <= 0) {
    return <span className="text-xs text-muted-foreground">Sem custo</span>
  }
  const positive = margin >= 0
  return (
    <div className="flex flex-col">
      <span
        className={cn(
          'text-sm font-bold',
          positive ? 'text-emerald-600' : 'text-destructive',
        )}
      >
        {formatBRL(margin)}
      </span>
      <span
        className={cn(
          'text-xs font-medium',
          positive ? 'text-emerald-600/80' : 'text-destructive/80',
        )}
      >
        {marginPercent.toFixed(1)}%
      </span>
    </div>
  )
}

function BestSellerBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
      <Flame className="h-3 w-3" />
      Mais vendido
    </span>
  )
}

function KpiCard({
  icon,
  label,
  value,
  tone = 'default',
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone?: 'default' | 'warning' | 'danger'
}) {
  const toneClasses = {
    default: 'text-primary',
    warning: 'text-accent-foreground',
    danger: 'text-destructive',
  }[tone]
  return (
    <Panel className="flex items-center gap-3 p-4">
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted',
          toneClasses,
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">
          {label}
        </p>
        <p className="text-lg font-bold text-foreground">{value}</p>
      </div>
    </Panel>
  )
}

function EmptyRow({ hasProducts }: { hasProducts: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Package className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold text-foreground">
        {hasProducts
          ? 'Nenhum produto encontrado'
          : 'Nenhum produto cadastrado ainda'}
      </p>
      <p className="text-xs text-muted-foreground">
        {hasProducts
          ? 'Ajuste os filtros ou cadastre um novo produto.'
          : 'Clique em "Novo produto" para cadastrar o primeiro item.'}
      </p>
    </div>
  )
}
