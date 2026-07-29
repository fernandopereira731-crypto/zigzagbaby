'use client'

import { useEffect, useState } from 'react'
import {
  Plus,
  Ticket,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
} from 'lucide-react'
import { formatBRL } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  toggleCouponActive,
  deleteCoupon,
  type Coupon,
  type CouponInput,
  type CouponDiscountType,
} from '../coupons-service'
import {
  Panel,
  StatusBadge,
  PrimaryButton,
  GhostButton,
  IconAction,
  Field,
  TextInput,
  MoneyInput,
  Select,
} from '../ui'

function formatDate(value: string | null): string {
  if (!value) return 'Sem validade'
  return new Date(value).toLocaleDateString('pt-BR')
}

export function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setCoupons(await listCoupons())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cupons')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function toggleActive(coupon: Coupon) {
    setBusyId(coupon.id)
    try {
      await toggleCouponActive(coupon.id, !coupon.isActive)
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === coupon.id ? { ...c, isActive: !c.isActive } : c,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar cupom')
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setBusyId(deleteTarget.id)
    try {
      await deleteCoupon(deleteTarget.id)
      setCoupons((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir cupom')
    } finally {
      setBusyId(null)
    }
  }

  function openNew() {
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(coupon: Coupon) {
    setEditing(coupon)
    setShowForm(true)
  }

  async function handleSaved() {
    setShowForm(false)
    setEditing(null)
    await load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {loading ? 'Carregando…' : `${coupons.length} cupons cadastrados`}
        </p>
        <PrimaryButton onClick={openNew}>
          <Plus className="h-4 w-4" />
          Novo cupom
        </PrimaryButton>
      </div>

      {error && (
        <div className="rounded-xl border border-secondary/40 bg-secondary/10 px-4 py-3 text-sm text-secondary-foreground">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : coupons.length === 0 ? (
        <Panel className="p-10 text-center text-muted-foreground">
          Nenhum cupom cadastrado ainda.
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {coupons.map((c) => {
            const usagePct =
              c.maxUses && c.maxUses > 0
                ? Math.min((c.usedCount / c.maxUses) * 100, 100)
                : 0
            const exhausted = c.maxUses != null && c.usedCount >= c.maxUses
            return (
              <Panel key={c.id} className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-dashed border-border bg-primary/5 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-primary" />
                    <span className="font-mono text-lg font-extrabold tracking-wide text-foreground">
                      {c.code}
                    </span>
                  </div>
                  <StatusBadge
                    label={c.isActive ? 'Ativo' : 'Inativo'}
                    className={
                      c.isActive
                        ? 'bg-whatsapp/15 text-whatsapp'
                        : 'bg-muted text-muted-foreground'
                    }
                  />
                </div>
                <div className="space-y-3 p-5">
                  <p className="text-2xl font-extrabold text-primary">
                    {c.discountType === 'percent'
                      ? `${c.discountValue}% OFF`
                      : `${formatBRL(c.discountValue)} OFF`}
                  </p>
                  <dl className="space-y-1.5 text-sm">
                    <Line label="Valor mínimo" value={formatBRL(c.minOrder)} />
                    <Line label="Validade" value={formatDate(c.expiresAt)} />
                    <Line
                      label="Usos"
                      value={
                        c.maxUses != null
                          ? `${c.usedCount} / ${c.maxUses}`
                          : `${c.usedCount} (ilimitado)`
                      }
                    />
                  </dl>
                  {c.maxUses != null && (
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          exhausted ? 'bg-secondary' : 'bg-primary',
                        )}
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={c.isActive}
                        disabled={busyId === c.id}
                        onClick={() => toggleActive(c)}
                        className={cn(
                          'relative h-6 w-11 rounded-full transition-colors',
                          c.isActive ? 'bg-primary' : 'bg-muted',
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform',
                            c.isActive ? 'left-0.5 translate-x-5' : 'left-0.5',
                          )}
                        />
                      </button>
                      {c.isActive ? 'Ativado' : 'Desativado'}
                    </label>
                    <div className="flex gap-1">
                      <IconAction label="Editar" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </IconAction>
                      <IconAction
                        label="Excluir"
                        className="hover:bg-secondary hover:text-secondary-foreground"
                        onClick={() => setDeleteTarget(c)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconAction>
                    </div>
                  </div>
                </div>
              </Panel>
            )
          })}
        </div>
      )}

      {showForm && (
        <CouponForm
          coupon={editing}
          onClose={() => {
            setShowForm(false)
            setEditing(null)
          }}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div
            className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-lg font-semibold text-foreground">
              Excluir cupom
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tem certeza que deseja excluir o cupom{' '}
              <span className="font-mono font-semibold text-foreground">
                {deleteTarget.code}
              </span>
              ? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-5 flex gap-3">
              <GhostButton
                type="button"
                className="flex-1"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </GhostButton>
              <PrimaryButton
                type="button"
                className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80"
                onClick={confirmDelete}
                disabled={busyId === deleteTarget.id}
              >
                {busyId === deleteTarget.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Excluir
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-foreground">{value}</dd>
    </div>
  )
}

function CouponForm({
  coupon,
  onClose,
  onSaved,
}: {
  coupon: Coupon | null
  onClose: () => void
  onSaved: () => void
}) {
  const [code, setCode] = useState(coupon?.code ?? '')
  const [description, setDescription] = useState(coupon?.description ?? '')
  const [discountType, setDiscountType] = useState<CouponDiscountType>(
    coupon?.discountType ?? 'percent',
  )
  const [discountValue, setDiscountValue] = useState(
    coupon ? String(coupon.discountValue) : '',
  )
  const [minOrder, setMinOrder] = useState<number | null>(
    coupon?.minOrder ?? null,
  )
  const [expiresAt, setExpiresAt] = useState(
    coupon?.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
  )
  const [maxUses, setMaxUses] = useState(
    coupon?.maxUses != null ? String(coupon.maxUses) : '',
  )
  const [isActive, setIsActive] = useState(coupon?.isActive ?? true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    const value = Number(discountValue)
    if (!code.trim()) {
      setFormError('Informe o código do cupom.')
      return
    }
    if (!Number.isFinite(value) || value <= 0) {
      setFormError('Informe um valor de desconto válido.')
      return
    }
    if (discountType === 'percent' && value > 100) {
      setFormError('O desconto percentual não pode ser maior que 100%.')
      return
    }

    const input: CouponInput = {
      code: code.trim().toUpperCase(),
      description: description.trim() || null,
      discountType,
      discountValue: value,
      minOrder: minOrder ?? 0,
      isActive,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      maxUses: maxUses.trim() ? Number(maxUses) : null,
    }

    setSaving(true)
    try {
      if (coupon) {
        await updateCoupon(coupon.id, input)
      } else {
        await createCoupon(input)
      }
      onSaved()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar cupom'
      setFormError(
        msg.includes('duplicate') || msg.includes('unique')
          ? 'Já existe um cupom com esse código.'
          : msg,
      )
    } finally {
      setSaving(false)
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
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-lg space-y-4 rounded-t-3xl bg-background p-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl font-semibold text-foreground">
            {coupon ? 'Editar cupom' : 'Novo cupom'}
          </h3>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {formError && (
          <div className="rounded-xl border border-secondary/40 bg-secondary/10 px-4 py-3 text-sm text-secondary-foreground">
            {formError}
          </div>
        )}

        <Field label="Código do cupom">
          <TextInput
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ex.: PRIMAVERA15"
            className="uppercase"
          />
        </Field>

        <Field label="Descrição (opcional)">
          <TextInput
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex.: Desconto de boas-vindas"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tipo de desconto">
            <Select
              value={discountType}
              onChange={(e) =>
                setDiscountType(e.target.value as CouponDiscountType)
              }
              className="w-full"
            >
              <option value="percent">Percentual (%)</option>
              <option value="fixed">Valor fixo (R$)</option>
            </Select>
          </Field>
          <Field label="Valor do desconto">
            <TextInput
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === 'percent' ? '10' : '25'}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Valor mínimo (R$)">
            <MoneyInput
              allowNull
              value={minOrder}
              onValueChange={setMinOrder}
              placeholder="99,00"
            />
          </Field>
          <Field label="Validade (opcional)">
            <TextInput
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Quantidade máxima de usos (opcional)">
          <TextInput
            type="number"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="Deixe vazio para ilimitado"
          />
        </Field>

        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Cupom ativo
        </label>

        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
          <GhostButton type="button" onClick={onClose}>
            Cancelar
          </GhostButton>
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Salvar cupom
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}
