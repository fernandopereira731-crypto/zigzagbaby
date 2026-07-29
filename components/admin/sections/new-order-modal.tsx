'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Trash2, UserPlus, X } from 'lucide-react'
import { formatBRL } from '@/lib/format'
import {
  Field,
  GhostButton,
  MoneyInput,
  PrimaryButton,
  Select,
  TextInput,
} from '../ui'
import {
  createManualOrder,
  listOrderProducts,
  type ManualOrderItemInput,
  type OrderProductOption,
} from '../orders-service'
import {
  listCustomerOptions,
} from '../customers-service'
import { NewCustomerModal } from './new-customer-modal'

type CustomerOption = {
  id: string
  name: string
  phone: string | null
  email: string | null
}

type DraftItem = ManualOrderItemInput & { maxStock: number; key: string }

const PAYMENT_OPTIONS = [
  { value: 'pix', label: 'PIX' },
  { value: 'card', label: 'Cartão' },
  { value: 'cash', label: 'Dinheiro' },
]

const ORIGIN_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'loja-fisica', label: 'Loja física' },
  { value: 'telefone', label: 'Telefone' },
]

export function NewOrderModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (orderNumber: string) => void
}) {
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [products, setProducts] = useState<OrderProductOption[]>([])
  const [loadingData, setLoadingData] = useState(false)

  const [profileId, setProfileId] = useState('')
  const [items, setItems] = useState<DraftItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [shipping, setShipping] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [origin, setOrigin] = useState('whatsapp')
  const [notes, setNotes] = useState('')

  const [productToAdd, setProductToAdd] = useState('')
  const [variantToAdd, setVariantToAdd] = useState('')

  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let active = true
    setLoadingData(true)
    Promise.all([listCustomerOptions(), listOrderProducts()])
      .then(([c, p]) => {
        if (!active) return
        setCustomers(c)
        setProducts(p)
      })
      .catch((err) => {
        if (!active) return
        setError(
          err instanceof Error ? err.message : 'Falha ao carregar dados.',
        )
      })
      .finally(() => active && setLoadingData(false))
    return () => {
      active = false
    }
  }, [open])

  const selectedCustomer = customers.find((c) => c.id === profileId) ?? null
  const selectedProduct = products.find((p) => p.id === productToAdd) ?? null

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0),
    [items],
  )
  const total = Math.max(subtotal - discount + shipping, 0)

  function resetForm() {
    setProfileId('')
    setItems([])
    setDiscount(0)
    setShipping(0)
    setPaymentMethod('pix')
    setOrigin('whatsapp')
    setNotes('')
    setProductToAdd('')
    setVariantToAdd('')
    setError(null)
  }

  function addItem() {
    if (!selectedProduct) return
    const variant =
      selectedProduct.variants.find((v) => v.id === variantToAdd) ?? null
    // Estoque efetivo: variação quando houver, senão do produto.
    const maxStock = variant ? variant.stock : selectedProduct.stock
    const key = `${selectedProduct.id}:${variant?.id ?? 'base'}`

    if (items.some((it) => it.key === key)) {
      setError('Este produto/variação já está no pedido.')
      return
    }
    if (maxStock <= 0) {
      setError('Produto sem estoque disponível.')
      return
    }

    const colorSize = [variant?.color, variant?.size].filter(Boolean).join(' / ')
    setItems((prev) => [
      ...prev,
      {
        key,
        productId: selectedProduct.id,
        variantId: variant?.id ?? null,
        productName: selectedProduct.name,
        color: variant?.color ?? null,
        size: variant?.size ?? null,
        unitPrice: selectedProduct.price,
        quantity: 1,
        imagePath: selectedProduct.image,
        maxStock,
      },
    ])
    setProductToAdd('')
    setVariantToAdd('')
    setError(null)
    void colorSize
  }

  function updateQty(key: string, qty: number) {
    setItems((prev) =>
      prev.map((it) =>
        it.key === key
          ? { ...it, quantity: Math.max(1, Math.min(qty, it.maxStock)) }
          : it,
      ),
    )
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((it) => it.key !== key))
  }

  async function handleSubmit() {
    if (saving) return
    if (!selectedCustomer) {
      setError('Selecione o cliente do pedido.')
      return
    }
    if (items.length === 0) {
      setError('Adicione ao menos um produto.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const result = await createManualOrder({
        profileId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        customerEmail: selectedCustomer.email,
        items: items.map(({ key, maxStock, ...rest }) => rest),
        discount,
        shipping,
        paymentMethod,
        notes,
        origin,
      })
      resetForm()
      onCreated(result.orderNumber)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível registrar o pedido.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-background shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Novo pedido
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {loadingData ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Carregando clientes e produtos...
            </div>
          ) : (
            <>
              {/* Cliente */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">
                    Cliente
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomer(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Cadastrar novo
                  </button>
                </div>
                <Select
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                  className="w-full"
                >
                  <option value="">Selecione um cliente...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.phone ? ` — ${c.phone}` : ''}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Adicionar produtos */}
              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Adicionar produto
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Select
                    value={productToAdd}
                    onChange={(e) => {
                      setProductToAdd(e.target.value)
                      setVariantToAdd('')
                    }}
                    className="flex-1"
                  >
                    <option value="">Selecione um produto...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatBRL(p.price)}
                      </option>
                    ))}
                  </Select>
                  {selectedProduct && selectedProduct.variants.length > 0 ? (
                    <Select
                      value={variantToAdd}
                      onChange={(e) => setVariantToAdd(e.target.value)}
                      className="flex-1"
                    >
                      <option value="">Variação...</option>
                      {selectedProduct.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {[v.color, v.size].filter(Boolean).join(' / ')} (
                          {v.stock} un.)
                        </option>
                      ))}
                    </Select>
                  ) : null}
                  <PrimaryButton
                    type="button"
                    onClick={addItem}
                    disabled={
                      !selectedProduct ||
                      (selectedProduct.variants.length > 0 && !variantToAdd)
                    }
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </PrimaryButton>
                </div>
              </div>

              {/* Itens do pedido */}
              {items.length > 0 ? (
                <div className="space-y-2">
                  {items.map((it) => (
                    <div
                      key={it.key}
                      className="flex items-center gap-3 rounded-xl border border-border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {it.productName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[it.color, it.size].filter(Boolean).join(' / ') ||
                            'Padrão'}{' '}
                          · {formatBRL(it.unitPrice)} · máx {it.maxStock}
                        </p>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={it.maxStock}
                        value={it.quantity}
                        onChange={(e) =>
                          updateQty(it.key, Number(e.target.value))
                        }
                        className="h-10 w-16 rounded-lg border border-input bg-background px-2 text-center text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <span className="w-24 text-right text-sm font-bold text-foreground">
                        {formatBRL(it.unitPrice * it.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(it.key)}
                        aria-label="Remover item"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                  Nenhum produto adicionado ainda.
                </p>
              )}

              {/* Valores */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Desconto (R$)">
                  <MoneyInput
                    value={discount}
                    onValueChange={(v) => setDiscount(v ?? 0)}
                    currency={false}
                  />
                </Field>
                <Field label="Frete (R$)">
                  <MoneyInput
                    value={shipping}
                    onValueChange={(v) => setShipping(v ?? 0)}
                    currency={false}
                  />
                </Field>
                <Field label="Forma de pagamento">
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full"
                  >
                    {PAYMENT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Origem do pedido">
                  <Select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full"
                  >
                    {ORIGIN_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Observações">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Detalhes do pedido, endereço de entrega, etc."
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </Field>

              {/* Resumo */}
              <div className="space-y-1 rounded-xl bg-muted/50 p-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatBRL(subtotal)}</span>
                </div>
                {discount > 0 ? (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Desconto</span>
                    <span>- {formatBRL(discount)}</span>
                  </div>
                ) : null}
                {shipping > 0 ? (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Frete</span>
                    <span>{formatBRL(shipping)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
                  <span>Total</span>
                  <span>{formatBRL(total)}</span>
                </div>
              </div>

              {error ? (
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground">
                  {error}
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="flex gap-3 border-t border-border px-5 py-4">
          <GhostButton type="button" className="flex-1" onClick={onClose}>
            Cancelar
          </GhostButton>
          <PrimaryButton
            type="button"
            className="flex-1"
            onClick={handleSubmit}
            disabled={saving || loadingData}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Registrar pedido
          </PrimaryButton>
        </div>
      </div>

      <NewCustomerModal
        open={showNewCustomer}
        onClose={() => setShowNewCustomer(false)}
        onCreated={(id, name) => {
          setShowNewCustomer(false)
          setCustomers((prev) => [
            { id, name, phone: null, email: null },
            ...prev,
          ])
          setProfileId(id)
        }}
      />
    </div>
  )
}
