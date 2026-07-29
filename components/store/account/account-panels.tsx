'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  CircleCheck,
  Clock,
  Heart,
  MapPin,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/format'
import { WhatsAppIcon } from '@/components/store/whatsapp-icon'
import { useStore } from '@/components/store/store-context'
import { statusLabels, WHATSAPP_URL, type Order } from './account-data'
import {
  ChildrenFields,
  toChildDraft,
  type ChildDraft,
} from './children-fields'
import {
  addAddress,
  addChild,
  deleteAddress,
  deleteChild,
  fetchAddresses,
  fetchChildren,
  fetchFavoriteProducts,
  setDefaultAddress,
  updateAddress,
  updateChild,
  updateProfile,
  type Address,
  type AddressInput,
  type FavoriteProduct,
  type Profile,
} from './account-service'

export type PanelKey =
  | 'overview'
  | 'orders'
  | 'favorites'
  | 'addresses'
  | 'profile'
  | 'returns'
  | 'tracking'

function SectionTitle({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="mb-5">
      <h2 className="font-serif text-2xl font-semibold text-foreground">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: Order['status'] }) {
  const s = statusLabels[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold',
        s.className,
      )}
    >
      {s.label}
    </span>
  )
}

/* ---------------- Overview ---------------- */

export function OverviewPanel({
  onNavigate,
  orders,
  firstName,
  since,
}: {
  onNavigate: (k: PanelKey) => void
  orders: Order[]
  firstName: string
  since: string
}) {
  const { favoritesCount } = useStore()
  const [addressCount, setAddressCount] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    fetchAddresses()
      .then((list) => {
        if (active) setAddressCount(list.length)
      })
      .catch(() => {
        if (active) setAddressCount(0)
      })
    return () => {
      active = false
    }
  }, [])

  const activeOrder = orders.find((o) => o.status === 'a-caminho')
  const stats = [
    {
      key: 'orders' as const,
      label: 'Pedidos',
      value: orders.length,
      icon: Package,
    },
    {
      key: 'favorites' as const,
      label: 'Favoritos',
      value: favoritesCount,
      icon: Heart,
    },
    {
      key: 'addresses' as const,
      label: 'Endereços',
      value: addressCount ?? '—',
      icon: MapPin,
    },
  ]

  return (
    <div>
      <SectionTitle
        title={firstName ? `Olá, ${firstName}!` : 'Olá!'}
        description={
          since
            ? `Cliente Zig Zag Baby desde ${since}. Que alegria ter você por aqui.`
            : 'Que alegria ter você por aqui.'
        }
      />

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => onNavigate(s.key)}
            className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <s.icon className="h-5 w-5" />
            </span>
            <span className="text-2xl font-extrabold text-foreground">
              {s.value}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {s.label}
            </span>
          </button>
        ))}
      </div>

      {activeOrder && (
        <div className="mt-5 overflow-hidden rounded-3xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border bg-primary/5 px-5 py-3">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold text-foreground">
                Pedido a caminho
              </span>
            </div>
            <StatusBadge status={activeOrder.status} />
          </div>
          <div className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground">
                {activeOrder.id}
              </span>
              <span className="text-muted-foreground">{activeOrder.date}</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('tracking')}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Truck className="h-4 w-4" />
              Acompanhar entrega
            </button>
          </div>
        </div>
      )}

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 flex items-center justify-between gap-3 rounded-3xl border border-whatsapp/30 bg-whatsapp/10 p-5 transition-colors hover:bg-whatsapp/15"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground">
            <WhatsAppIcon className="h-5 w-5" />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">
              Precisa de ajuda?
            </span>
            <span className="text-xs text-muted-foreground">
              Fale com nosso atendimento humanizado
            </span>
          </div>
        </div>
        <span className="text-sm font-bold text-whatsapp">Chamar</span>
      </a>
    </div>
  )
}

/* ---------------- Orders ---------------- */

export function OrdersPanel({
  onTrack,
  orders,
  loading = false,
  error = null,
}: {
  onTrack: () => void
  orders: Order[]
  loading?: boolean
  error?: string | null
}) {
  return (
    <div>
      <SectionTitle
        title="Meus pedidos"
        description="Acompanhe suas compras e histórico de pedidos."
      />
      {loading ? (
        <div className="flex flex-col gap-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-3xl border border-border bg-muted"
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-destructive/40 bg-destructive/5 px-6 py-12 text-center">
          <p className="text-sm font-bold text-foreground">{error}</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Tente novamente em instantes.
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Package className="h-7 w-7" />
          </span>
          <p className="text-sm font-bold text-foreground">
            Você ainda não tem pedidos
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Quando finalizar uma compra, ela aparecerá aqui para você
            acompanhar.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="overflow-hidden rounded-3xl border border-border bg-card"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">
                    {order.id}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {order.date}
                  </span>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="flex flex-col gap-3 p-5">
                {order.items.map((item, idx) => (
                  <div key={`${item.name}-${idx}`} className="flex items-center gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      <Image
                        src={item.image || '/placeholder.svg'}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tam. {item.size} · {item.color} · {item.qty}x
                      </p>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {formatBRL(item.price)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
                <span className="text-sm text-muted-foreground">
                  Total:{' '}
                  <span className="font-bold text-foreground">
                    {formatBRL(order.total)}
                  </span>
                </span>
                <div className="flex gap-2">
                  {order.status === 'a-caminho' && (
                    <button
                      type="button"
                      onClick={onTrack}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Truck className="h-4 w-4" />
                      Rastrear
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- Favorites ---------------- */

export function FavoritesPanel() {
  const { favoriteIds, toggleFavorite, addToCart } = useStore()
  const [products, setProducts] = useState<FavoriteProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    fetchFavoriteProducts(favoriteIds)
      .then((list) => {
        if (active) setProducts(list)
      })
      .catch((err: unknown) => {
        if (active)
          setError(
            err instanceof Error ? err.message : 'Erro ao carregar favoritos.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [favoriteIds])

  return (
    <div>
      <SectionTitle
        title="Favoritos"
        description="As peças que você separou com carinho."
      />
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-3xl border border-border bg-muted"
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-destructive/40 bg-destructive/5 px-6 py-12 text-center">
          <p className="text-sm font-bold text-foreground">{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Heart className="h-7 w-7" />
          </span>
          <p className="text-sm font-bold text-foreground">
            Nenhum favorito ainda
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Toque no coração dos produtos para guardá-los aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {products.map((fav) => (
            <div
              key={fav.id}
              className="group overflow-hidden rounded-3xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={fav.image || '/placeholder.svg'}
                  alt={fav.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={() => toggleFavorite(fav.id)}
                  aria-label="Remover dos favoritos"
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 text-secondary-foreground shadow-sm backdrop-blur transition-transform hover:scale-110"
                >
                  <Heart className="h-4 w-4 fill-secondary-foreground" />
                </button>
              </div>
              <div className="flex flex-col gap-1 p-3">
                <span className="text-xs font-medium text-primary">
                  {fav.category}
                </span>
                <p className="line-clamp-2 text-sm font-semibold text-foreground">
                  {fav.name}
                </p>
                <p className="text-sm font-extrabold text-foreground">
                  {formatBRL(fav.pixPrice)}{' '}
                  <span className="text-xs font-medium text-muted-foreground">
                    no PIX
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() =>
                    addToCart({
                      id: fav.id,
                      name: fav.name,
                      price: fav.price,
                      image: fav.image,
                      color: '',
                      size: '',
                    })
                  }
                  className="mt-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-primary text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Adicionar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- Addresses ---------------- */

const emptyAddress: AddressInput = {
  label: '',
  recipientName: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
  isDefault: false,
}

function AddressInputField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <input
        type="text"
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  )
}

export function AddressesPanel() {
  const [list, setList] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Address | 'new' | null>(null)
  const [form, setForm] = useState<AddressInput>(emptyAddress)
  const [saving, setSaving] = useState(false)

  async function reload() {
    setLoading(true)
    setError(null)
    try {
      setList(await fetchAddresses())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  function openNew() {
    setForm(emptyAddress)
    setEditing('new')
  }

  function openEdit(addr: Address) {
    const { id: _id, ...rest } = addr
    setForm(rest)
    setEditing(addr)
  }

  function closeForm() {
    setEditing(null)
    setForm(emptyAddress)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (editing === 'new') {
        await addAddress(form)
      } else if (editing) {
        await updateAddress(editing.id, form)
      }
      closeForm()
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAddress(id)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover.')
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await setDefaultAddress(id)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar.')
    }
  }

  return (
    <div>
      <SectionTitle
        title="Endereços"
        description="Gerencie onde você quer receber seus pedidos."
      />

      {error && (
        <p className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {editing ? (
        <form
          onSubmit={handleSave}
          className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              {editing === 'new' ? 'Novo endereço' : 'Editar endereço'}
            </h3>
            <button
              type="button"
              onClick={closeForm}
              aria-label="Cancelar"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <AddressInputField
              label="Identificação"
              value={form.label}
              onChange={(v) => setForm((f) => ({ ...f, label: v }))}
              placeholder="Casa, Trabalho..."
            />
            <AddressInputField
              label="Destinatário"
              value={form.recipientName}
              onChange={(v) => setForm((f) => ({ ...f, recipientName: v }))}
              placeholder="Quem recebe"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <AddressInputField
              label="CEP"
              value={form.zipCode}
              onChange={(v) => setForm((f) => ({ ...f, zipCode: v }))}
              placeholder="00000-000"
              required
            />
            <div className="sm:col-span-2">
              <AddressInputField
                label="Rua"
                value={form.street}
                onChange={(v) => setForm((f) => ({ ...f, street: v }))}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <AddressInputField
              label="Número"
              value={form.number}
              onChange={(v) => setForm((f) => ({ ...f, number: v }))}
            />
            <div className="sm:col-span-2">
              <AddressInputField
                label="Complemento"
                value={form.complement}
                onChange={(v) => setForm((f) => ({ ...f, complement: v }))}
                placeholder="Apto, bloco (opcional)"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <AddressInputField
              label="Bairro"
              value={form.neighborhood}
              onChange={(v) => setForm((f) => ({ ...f, neighborhood: v }))}
            />
            <AddressInputField
              label="Cidade"
              value={form.city}
              onChange={(v) => setForm((f) => ({ ...f, city: v }))}
              required
            />
            <AddressInputField
              label="Estado (UF)"
              value={form.state}
              onChange={(v) => setForm((f) => ({ ...f, state: v }))}
              required
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) =>
                setForm((f) => ({ ...f, isDefault: e.target.checked }))
              }
              className="h-4 w-4 rounded border-input accent-primary"
            />
            Definir como endereço padrão
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 sm:self-start"
          >
            {saving ? 'Salvando...' : 'Salvar endereço'}
          </button>
        </form>
      ) : loading ? (
        <div className="flex flex-col gap-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-3xl border border-border bg-muted"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {list.map((addr) => (
            <div
              key={addr.id}
              className="rounded-3xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
                          Padrão
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-foreground">
                      {addr.street}
                      {addr.number ? `, ${addr.number}` : ''}
                      {addr.complement ? ` - ${addr.complement}` : ''}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[addr.neighborhood, `${addr.city}${addr.state ? ` - ${addr.state}` : ''}`]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {addr.zipCode && (
                      <p className="text-sm text-muted-foreground">
                        CEP {addr.zipCode}
                      </p>
                    )}
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr.id)}
                        className="mt-2 text-xs font-bold text-primary hover:underline"
                      >
                        Tornar padrão
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(addr)}
                    aria-label="Editar endereço"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    aria-label="Remover endereço"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={openNew}
            className="flex h-14 items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border text-sm font-bold text-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
          >
            <Plus className="h-5 w-5" />
            Adicionar novo endereço
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------------- Profile ---------------- */

function ProfileField({
  label,
  value,
  onChange,
  type = 'text',
  disabled,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  type?: string
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
      />
    </div>
  )
}

export function ProfilePanel({
  profile,
  onSaved,
}: {
  profile: Profile | null
  onSaved: () => void
}) {
  const [fullName, setFullName] = useState(profile?.fullName ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [cpf, setCpf] = useState(profile?.cpf ?? '')
  const [birthDate, setBirthDate] = useState(profile?.birthDate ?? '')
  const [children, setChildren] = useState<ChildDraft[]>([])
  const [originalIds, setOriginalIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'ok' | 'err'
    text: string
  } | null>(null)

  useEffect(() => {
    setFullName(profile?.fullName ?? '')
    setPhone(profile?.phone ?? '')
    setCpf(profile?.cpf ?? '')
    setBirthDate(profile?.birthDate ?? '')
  }, [profile])

  useEffect(() => {
    let active = true
    fetchChildren()
      .then((list) => {
        if (!active) return
        setChildren(list.map(toChildDraft))
        setOriginalIds(new Set(list.map((c) => c.id)))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)
    try {
      await updateProfile({ fullName, phone, cpf, birthDate })

      // Diff das crianças: adicionar, atualizar e remover.
      const currentKeys = new Set(children.map((c) => c.key))
      const toRemove = [...originalIds].filter((id) => !currentKeys.has(id))

      await Promise.all([
        ...children
          .filter((c) => c.childName.trim())
          .map((c) => {
            const payload = {
              childName: c.childName,
              birthDate: c.birthDate,
              preferredStyle: c.preferredStyle,
            }
            return originalIds.has(c.key)
              ? updateChild(c.key, payload)
              : addChild(payload)
          }),
        ...toRemove.map((id) => deleteChild(id)),
      ])

      // Recarrega crianças para refletir novos ids.
      const fresh = await fetchChildren()
      setChildren(fresh.map(toChildDraft))
      setOriginalIds(new Set(fresh.map((c) => c.id)))

      setFeedback({ type: 'ok', text: 'Dados salvos com sucesso!' })
      onSaved()
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erro ao salvar.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <SectionTitle
        title="Dados pessoais"
        description="Mantenha suas informações sempre atualizadas."
      />
      {feedback && (
        <p
          className={cn(
            'mb-4 rounded-2xl border px-4 py-3 text-sm',
            feedback.type === 'ok'
              ? 'border-whatsapp/30 bg-whatsapp/10 text-foreground'
              : 'border-destructive/30 bg-destructive/10 text-destructive',
          )}
        >
          {feedback.text}
        </p>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6"
      >
        <ProfileField
          label="Nome completo"
          value={fullName}
          onChange={setFullName}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileField
            label="E-mail"
            value={profile?.email ?? ''}
            type="email"
            disabled
          />
          <ProfileField
            label="WhatsApp"
            value={phone}
            onChange={setPhone}
            type="tel"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileField label="CPF" value={cpf} onChange={setCpf} />
          <ProfileField
            label="Data de nascimento"
            value={birthDate}
            onChange={setBirthDate}
            type="date"
          />
        </div>

        <div className="my-1 border-t border-border" />

        <ChildrenFields
          idPrefix="profile-child"
          value={children}
          onChange={setChildren}
        />

        <button
          type="submit"
          disabled={saving}
          className="mt-1 inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 sm:self-start"
        >
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
    </div>
  )
}

/* ---------------- Returns ---------------- */

export function ReturnsPanel() {
  return (
    <div>
      <SectionTitle
        title="Trocas e devoluções"
        description="Solicite trocas em até 30 dias. É rápido e sem burocracia."
      />

      <div className="mb-5 flex flex-col gap-3 rounded-3xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <RefreshCw className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">
              Quer trocar uma peça?
            </p>
            <p className="text-sm text-muted-foreground">
              Fale com nosso atendimento pelo WhatsApp e abrimos sua
              solicitação na hora.
            </p>
          </div>
        </div>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-whatsapp px-5 text-sm font-bold text-whatsapp-foreground transition-transform hover:brightness-105 active:scale-[0.99]"
        >
          <WhatsAppIcon className="h-4 w-4" />
          Solicitar troca
        </a>
      </div>
    </div>
  )
}

/* ---------------- Tracking ---------------- */

export function TrackingPanel({ orders }: { orders: Order[] }) {
  const order = orders.find((o) => o.status === 'a-caminho') ?? orders[0]

  if (!order) {
    return (
      <div>
        <SectionTitle
          title="Acompanhar entrega"
          description="Você ainda não tem entregas em andamento."
        />
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Truck className="h-7 w-7" />
          </span>
          <p className="text-sm font-bold text-foreground">
            Nenhuma entrega para acompanhar
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Assim que um pedido for enviado, o rastreio aparecerá aqui.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <SectionTitle
        title="Acompanhar entrega"
        description={`Pedido ${order.id} · ${order.date}`}
      />

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border bg-primary/5 px-5 py-4">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-foreground">
              {order.status === 'a-caminho'
                ? 'Pedido a caminho'
                : 'Pedido entregue'}
            </span>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="p-6">
          <ol className="relative flex flex-col gap-6">
            {order.tracking.map((step, i) => {
              const isLast = i === order.tracking.length - 1
              return (
                <li key={step.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full border-2',
                        step.done
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-dashed border-primary/40 bg-card text-primary',
                      )}
                    >
                      {step.done ? (
                        <CircleCheck className="h-5 w-5" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </span>
                    {!isLast && (
                      <span
                        className={cn(
                          'mt-1 h-full w-0.5 flex-1',
                          step.done ? 'bg-primary' : 'bg-border',
                        )}
                      />
                    )}
                  </div>
                  <div className="pb-2">
                    <p
                      className={cn(
                        'text-sm font-bold',
                        step.done ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {step.step}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.date}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="border-t border-border p-5">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-whatsapp text-sm font-bold text-whatsapp-foreground transition-transform hover:brightness-105 active:scale-[0.99]"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Falar sobre esta entrega
          </a>
        </div>
      </div>
    </div>
  )
}
