'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Baby,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { formatBRL } from '@/lib/format'
import {
  CHILDREN_HINT,
  formatChildAge,
  sexLabels,
} from '@/lib/children-profiles'
import { Panel, PrimaryButton, SearchInput } from '../ui'
import {
  deleteCustomer,
  formatCustomerDate,
  getCustomerDetail,
  listCustomers,
  type AdminCustomerDetail,
  type AdminCustomerRow,
} from '../customers-service'
import { NewCustomerModal } from './new-customer-modal'

export function Customers() {
  const [customers, setCustomers] = useState<AdminCustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<AdminCustomerRow | null>(null)
  const [showNewCustomer, setShowNewCustomer] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listCustomers()
      setCustomers(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar os clientes.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.city.toLowerCase().includes(query.toLowerCase()) ||
          (c.email ?? '').toLowerCase().includes(query.toLowerCase()),
      ),
    [customers, query],
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando clientes...</p>
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
          placeholder="Buscar cliente por nome, cidade ou e-mail..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <PrimaryButton
          type="button"
          onClick={() => setShowNewCustomer(true)}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
          Novo cliente
        </PrimaryButton>
      </div>

      <NewCustomerModal
        open={showNewCustomer}
        onClose={() => setShowNewCustomer(false)}
        onCreated={() => {
          setShowNewCustomer(false)
          load()
        }}
      />

      {/* Desktop */}
      <Panel className="hidden overflow-hidden lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Cliente</th>
              <th className="px-4 py-3 font-semibold">Cidade</th>
              <th className="px-4 py-3 font-semibold">Telefone</th>
              <th className="px-4 py-3 font-semibold">Última compra</th>
              <th className="px-4 py-3 font-semibold">Pedidos</th>
              <th className="px-4 py-3 font-semibold">Total gasto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c) => (
              <tr
                key={c.id}
                onClick={() => setSelected(c)}
                className="cursor-pointer transition-colors hover:bg-muted/40"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {c.name.charAt(0)}
                    </span>
                    <span className="font-semibold text-foreground">
                      {c.name}
                    </span>
                    {c.childrenCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                        <Baby className="h-3 w-3" />
                        {c.childrenCount}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.city}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.phone ?? '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatCustomerDate(c.lastPurchase)}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {c.orders}
                </td>
                <td className="px-4 py-3 font-bold text-foreground">
                  {formatBRL(c.totalSpent)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <Empty />}
      </Panel>

      {/* Mobile */}
      <div className="space-y-3 lg:hidden">
        {filtered.map((c) => (
          <Panel key={c.id} className="p-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelected(c)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                  {c.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-semibold text-foreground">
                    {c.name}
                    {c.childrenCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                        <Baby className="h-3 w-3" />
                        {c.childrenCount}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{c.city}</p>
                </div>
              </button>
              {c.phone && (
                <a
                  href={`https://wa.me/55${c.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chamar no WhatsApp"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-whatsapp/10 text-whatsapp"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
              <div>
                <p className="text-sm font-bold text-foreground">{c.orders}</p>
                <p className="text-[11px] text-muted-foreground">Pedidos</p>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {formatBRL(c.totalSpent)}
                </p>
                <p className="text-[11px] text-muted-foreground">Total gasto</p>
              </div>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                {c.phone ? c.phone.slice(-4) : '—'}
              </div>
            </div>
          </Panel>
        ))}
        {filtered.length === 0 && (
          <Panel className="py-12">
            <Empty />
          </Panel>
        )}
      </div>

      {selected && (
        <CustomerDetail
          customer={selected}
          onClose={() => setSelected(null)}
          onDeleted={(deletedId) => {
            setCustomers((prev) => prev.filter((c) => c.id !== deletedId))
            setSelected(null)
          }}
        />
      )}
    </div>
  )
}

function CustomerDetail({
  customer,
  onClose,
  onDeleted,
}: {
  customer: AdminCustomerRow
  onClose: () => void
  onDeleted: (customerId: string) => void
}) {
  const [detail, setDetail] = useState<AdminCustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteCustomer(customer.id)
      onDeleted(customer.id)
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : 'Não foi possível excluir o cliente.',
      )
      setDeleting(false)
    }
  }

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    getCustomerDetail(customer.id)
      .then((d) => {
        if (active) setDetail(d)
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error
              ? err.message
              : 'Não foi possível carregar os detalhes.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [customer.id])

  const children = detail?.children ?? []
  const addresses = detail?.addresses ?? []
  const orders = detail?.orders ?? []
  const favorites = detail?.favorites ?? []

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Perfil de ${customer.name}`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border border-border bg-background shadow-xl sm:max-w-lg sm:rounded-3xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
              {customer.name.charAt(0)}
            </span>
            <div>
              <p className="font-bold text-foreground">{customer.name}</p>
              <p className="text-xs text-muted-foreground">{customer.city}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-muted/50 p-3">
              <p className="text-sm font-bold text-foreground">
                {customer.orders}
              </p>
              <p className="text-[11px] text-muted-foreground">Pedidos</p>
            </div>
            <div className="rounded-2xl bg-muted/50 p-3">
              <p className="text-sm font-bold text-foreground">
                {formatBRL(customer.totalSpent)}
              </p>
              <p className="text-[11px] text-muted-foreground">Total gasto</p>
            </div>
            <div className="rounded-2xl bg-muted/50 p-3">
              <p className="text-sm font-bold text-foreground">
                {customer.favoritesCount}
              </p>
              <p className="text-[11px] text-muted-foreground">Favoritos</p>
            </div>
          </div>

          {/* Contato */}
          <div className="rounded-2xl border border-border bg-card p-4 text-sm">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {customer.email && (
                <span className="text-muted-foreground">{customer.email}</span>
              )}
              {customer.phone && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  {customer.phone}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Cliente desde {formatCustomerDate(customer.createdAt)}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Carregando detalhes...
            </div>
          ) : error ? (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </p>
          ) : (
            <>
              {/* Filhos */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                  <Baby className="h-4 w-4 text-primary" />
                  Filhos {children.length > 0 && `(${children.length})`}
                </h3>
                {children.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    Este cliente ainda não cadastrou informações sobre crianças.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
                      >
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {child.childName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {child.birthDate
                              ? new Date(child.birthDate).toLocaleDateString(
                                  'pt-BR',
                                )
                              : ''}
                            {child.birthDate && ' · '}
                            {formatChildAge(child.birthDate)}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                          {sexLabels[child.sex]}
                        </span>
                      </div>
                    ))}
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {CHILDREN_HINT}
                    </p>
                  </div>
                )}
              </section>

              {/* Endereços */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  Endereços {addresses.length > 0 && `(${addresses.length})`}
                </h3>
                {addresses.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    Nenhum endereço cadastrado.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {addresses.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-2xl border border-border bg-card p-4 text-sm"
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-bold text-foreground">
                            {a.label || 'Endereço'}
                          </span>
                          {a.is_default && (
                            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              Padrão
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground">
                          {[a.street, a.number].filter(Boolean).join(', ')}
                          {a.complement ? ` · ${a.complement}` : ''}
                        </p>
                        <p className="text-muted-foreground">
                          {[a.neighborhood, a.city, a.state]
                            .filter(Boolean)
                            .join(' · ')}
                          {a.zip_code ? ` · CEP ${a.zip_code}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Pedidos */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                  <Package className="h-4 w-4 text-primary" />
                  Pedidos {orders.length > 0 && `(${orders.length})`}
                </h3>
                {orders.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    Este cliente ainda não fez pedidos.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {orders.map((o) => (
                      <div
                        key={o.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-foreground">
                            {o.orderNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCustomerDate(o.createdAt)} ·{' '}
                            {o.itemsCount}{' '}
                            {o.itemsCount === 1 ? 'item' : 'itens'}
                          </p>
                        </div>
                        <span className="shrink-0 font-bold text-foreground">
                          {formatBRL(o.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Favoritos */}
              {favorites.length > 0 && (
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                    <Heart className="h-4 w-4 text-primary" />
                    Favoritos ({favorites.length})
                  </h3>
                  <div className="flex flex-col gap-2">
                    {favorites.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm"
                      >
                        <span className="min-w-0 truncate text-foreground">
                          {f.productName || 'Produto indisponível'}
                        </span>
                        {f.price != null && (
                          <span className="shrink-0 font-semibold text-muted-foreground">
                            {formatBRL(f.price)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Excluir cliente */}
          <div className="border-t border-border pt-4">
            {deleteError && (
              <p className="mb-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {deleteError}
              </p>
            )}
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(true)
                  setDeleteError(null)
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Excluir cliente
              </button>
            ) : (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Excluir {customer.name} permanentemente?
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Esta ação não pode ser desfeita. Serão removidos os dados do
                  cliente, crianças e endereços. O histórico de pedidos é
                  preservado nas vendas.
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
    </div>
  )
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Users className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold text-foreground">
        Nenhum cliente encontrado
      </p>
    </div>
  )
}
