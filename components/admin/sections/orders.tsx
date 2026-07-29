'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import {
  Eye,
  Plus,
  RefreshCw,
  X,
  ShoppingBag,
  Loader2,
  AlertCircle,
  Check,
  Trash2,
} from 'lucide-react'
import { formatBRL } from '@/lib/format'
import {
  listOrders,
  updateOrderStatus,
  deleteOrder,
  orderStatusLabel,
  paymentMethodLabel,
  deliveryMethodLabel,
  formatOrderDate,
  ADMIN_ORDER_STATUSES,
  type AdminOrderRow,
} from '../orders-service'
import {
  Panel,
  StatusBadge,
  SearchInput,
  Select,
  IconAction,
  PrimaryButton,
} from '../ui'
import { NewOrderModal } from './new-order-modal'

export function Orders() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<AdminOrderRow | null>(null)
  const [showNewOrder, setShowNewOrder] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listOrders()
      setOrders(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível carregar os pedidos.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (
        query &&
        !o.orderNumber.toLowerCase().includes(query.toLowerCase()) &&
        !o.customer.toLowerCase().includes(query.toLowerCase())
      )
        return false
      if (status && o.status !== status) return false
      return true
    })
  }, [orders, query, status])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando pedidos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Panel className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-6 w-6" />
        </span>
        <p className="text-sm font-semibold text-foreground">{error}</p>
        <button
          onClick={load}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      </Panel>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          placeholder="Buscar por número ou cliente..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {ADMIN_ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {orderStatusLabel(s).label}
            </option>
          ))}
        </Select>
        <IconAction label="Atualizar" onClick={load}>
          <RefreshCw className="h-4 w-4" />
        </IconAction>
        <PrimaryButton
          type="button"
          onClick={() => setShowNewOrder(true)}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
          Novo pedido
        </PrimaryButton>
      </div>

      <NewOrderModal
        open={showNewOrder}
        onClose={() => setShowNewOrder(false)}
        onCreated={() => {
          setShowNewOrder(false)
          load()
        }}
      />

      {/* Desktop */}
      <Panel className="hidden overflow-hidden lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Pedido</th>
              <th className="px-4 py-3 font-semibold">Cliente</th>
              <th className="px-4 py-3 font-semibold">Pagamento</th>
              <th className="px-4 py-3 font-semibold">Data</th>
              <th className="px-4 py-3 font-semibold">Valor</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((o) => {
              const st = orderStatusLabel(o.status)
              return (
                <tr key={o.id} className="transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3 font-bold text-foreground">
                    {o.orderNumber}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{o.customer}</p>
                    <p className="text-xs text-muted-foreground">{o.city}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {paymentMethodLabel(o.paymentMethod)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatOrderDate(o.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-bold text-foreground">
                    {formatBRL(o.total)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={st.label} className={st.className} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconAction label="Visualizar" onClick={() => setSelected(o)}>
                        <Eye className="h-4 w-4" />
                      </IconAction>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <Empty />}
      </Panel>

      {/* Mobile */}
      <div className="space-y-3 lg:hidden">
        {filtered.map((o) => {
          const st = orderStatusLabel(o.status)
          return (
            <Panel key={o.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-foreground">{o.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">{o.customer}</p>
                </div>
                <StatusBadge label={st.label} className={st.className} />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatOrderDate(o.createdAt)} · {paymentMethodLabel(o.paymentMethod)}
                </span>
                <span className="font-bold text-foreground">
                  {formatBRL(o.total)}
                </span>
              </div>
              <div className="mt-3 flex gap-2 border-t border-border pt-3">
                <button
                  onClick={() => setSelected(o)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
                >
                  <Eye className="h-4 w-4" /> Ver pedido
                </button>
              </div>
            </Panel>
          )
        })}
        {filtered.length === 0 && (
          <Panel className="py-12">
            <Empty />
          </Panel>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <OrderDetail
          order={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? updated : o)),
            )
            setSelected(updated)
          }}
          onDeleted={(deletedId) => {
            setOrders((prev) => prev.filter((o) => o.id !== deletedId))
            setSelected(null)
          }}
        />
      )}
    </div>
  )
}

function OrderDetail({
  order,
  onClose,
  onUpdated,
  onDeleted,
}: {
  order: AdminOrderRow
  onClose: () => void
  onUpdated: (order: AdminOrderRow) => void
  onDeleted: (orderId: string) => void
}) {
  const [status, setStatus] = useState(order.status)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleUpdate() {
    if (saving || status === order.status) return
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await updateOrderStatus(order.id, status)
      onUpdated({ ...order, status })
      setSaved(true)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível atualizar o status.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    setError(null)
    try {
      await deleteOrder(order.id, true)
      onDeleted(order.id)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível excluir o pedido.',
      )
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-background p-6 shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-serif text-xl font-semibold text-foreground">
              {order.orderNumber}
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatOrderDate(order.createdAt)} · {order.itemsCount} itens
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Itens do pedido */}
        <ul className="mt-4 flex flex-col gap-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                <Image
                  src={item.image || '/placeholder.svg'}
                  alt={item.productName}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <p className="text-sm font-bold leading-tight text-foreground">
                  {item.productName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[item.color, item.size ? `Tam ${item.size}` : null]
                    .filter(Boolean)
                    .join(' · ')}
                  {' · '}
                  {item.quantity}x
                </p>
              </div>
              <span className="self-center text-sm font-bold text-foreground">
                {formatBRL(item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 rounded-2xl bg-muted/50 p-4 text-sm">
          <Row label="Cliente" value={order.customer} />
          {order.phone && <Row label="Telefone" value={order.phone} />}
          {order.email && <Row label="E-mail" value={order.email} />}
          <Row label="Cidade" value={order.city} />
          <Row label="Entrega" value={deliveryMethodLabel(order.deliveryMethod)} />
          <Row label="Pagamento" value={paymentMethodLabel(order.paymentMethod)} />
          {order.giftWrap && <Row label="Embrulho presente" value={formatBRL(order.giftFee)} />}
          <Row label="Subtotal" value={formatBRL(order.subtotal)} />
          {order.discount > 0 && (
            <Row label="Desconto" value={`- ${formatBRL(order.discount)}`} />
          )}
          <Row
            label="Frete"
            value={order.shipping === 0 ? 'Grátis' : formatBRL(order.shipping)}
          />
          <Row label="Total" value={formatBRL(order.total)} strong />
        </dl>

        {order.notes && (
          <div className="mt-4 rounded-2xl border border-border p-4 text-sm">
            <p className="font-semibold text-foreground">Observações</p>
            <p className="mt-1 text-muted-foreground">{order.notes}</p>
          </div>
        )}

        <div className="mt-4 space-y-2">
          <label className="text-sm font-semibold text-foreground">
            Alterar status
          </label>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setSaved(false)
            }}
            className="w-full"
          >
            {ADMIN_ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {orderStatusLabel(s).label}
              </option>
            ))}
          </Select>
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-xs font-medium text-destructive">{error}</p>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={handleUpdate}
            disabled={saving || status === order.status}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : saved ? (
              <>
                <Check className="h-4 w-4" />
                Status atualizado
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Atualizar status
              </>
            )}
          </button>
        </div>

        {/* Excluir pedido */}
        <div className="mt-4 border-t border-border pt-4">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => {
                setConfirmDelete(true)
                setError(null)
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Excluir pedido
            </button>
          ) : (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm font-semibold text-foreground">
                Excluir este pedido permanentemente?
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Esta ação não pode ser desfeita. Os itens voltarão ao estoque.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-destructive text-sm font-bold text-destructive-foreground hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Sim, excluir
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-border text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={
          strong
            ? 'font-bold text-foreground'
            : 'text-right font-medium text-foreground'
        }
      >
        {value}
      </dd>
    </div>
  )
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ShoppingBag className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold text-foreground">
        Nenhum pedido encontrado
      </p>
    </div>
  )
}
