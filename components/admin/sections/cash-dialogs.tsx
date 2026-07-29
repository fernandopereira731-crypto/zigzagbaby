'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { formatBRL } from '@/lib/format'
import {
  Field,
  TextInput,
  MoneyInput,
  Select,
  PrimaryButton,
  GhostButton,
} from '../ui'
import {
  addMovement,
  addExpense,
  closeRegister,
  summarizeMovements,
  expenseCategoryLabels,
  movementLabels,
  type CashMovement,
  type MovementType,
  type ExpenseCategory,
} from '../cash-service'

/* ---------- Shell de modal ---------- */
function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-background shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-serif text-lg font-semibold text-foreground">
            {title}
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
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

function ErrorText({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
      {message}
    </p>
  )
}

/* ---------- Modal de movimentação (suprimento, sangria, venda, estorno) ---------- */
export function MovementDialog({
  registerId,
  onClose,
  onSaved,
}: {
  registerId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [type, setType] = useState<MovementType>('supply')
  const [amount, setAmount] = useState(0)
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Tipos lançáveis manualmente (despesa tem modal próprio).
  const options: MovementType[] = [
    'supply',
    'withdrawal',
    'sale_cash',
    'sale_pix',
    'sale_card',
    'refund',
  ]

  async function submit() {
    setError(null)
    if (!(amount > 0)) {
      setError('Informe um valor maior que zero.')
      return
    }
    setSaving(true)
    try {
      await addMovement({ registerId, type, amount, description })
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e.message || 'Não foi possível registrar a movimentação.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title="Nova movimentação" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Tipo">
          <Select
            className="w-full"
            value={type}
            onChange={(e) => setType(e.target.value as MovementType)}
          >
            {options.map((o) => (
              <option key={o} value={o}>
                {movementLabels[o]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Valor (R$)">
          <MoneyInput value={amount} onValueChange={(n) => setAmount(n ?? 0)} />
        </Field>
        <Field label="Descrição" hint="Opcional">
          <TextInput
            placeholder="Ex.: troco extra, venda balcão..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <ErrorText message={error} />
        <div className="flex gap-2 pt-2">
          <GhostButton className="flex-1" onClick={onClose} disabled={saving}>
            Cancelar
          </GhostButton>
          <PrimaryButton className="flex-1" onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Registrar
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  )
}

/* ---------- Modal de despesa ---------- */
export function ExpenseDialog({
  registerId,
  onClose,
  onSaved,
}: {
  registerId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('fornecedor')
  const [amount, setAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('dinheiro')
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [receipt, setReceipt] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    if (!description.trim()) {
      setError('Informe a descrição da despesa.')
      return
    }
    if (!(amount > 0)) {
      setError('Informe um valor maior que zero.')
      return
    }
    setSaving(true)
    try {
      await addExpense({
        registerId,
        description,
        category,
        amount,
        paymentMethod,
        supplier,
        notes,
        receiptFile: receipt,
      })
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e.message || 'Não foi possível registrar a despesa.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title="Nova despesa" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Descrição">
          <TextInput
            placeholder="Ex.: compra de sacolas"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoria">
            <Select
              className="w-full"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            >
              {(
                Object.keys(expenseCategoryLabels) as ExpenseCategory[]
              ).map((c) => (
                <option key={c} value={c}>
                  {expenseCategoryLabels[c]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Valor (R$)">
            <MoneyInput
              value={amount}
              onValueChange={(n) => setAmount(n ?? 0)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Forma de pagamento">
            <Select
              className="w-full"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="dinheiro">Dinheiro</option>
              <option value="pix">PIX</option>
              <option value="cartao">Cartão</option>
              <option value="boleto">Boleto</option>
              <option value="transferencia">Transferência</option>
            </Select>
          </Field>
          <Field label="Fornecedor" hint="Opcional">
            <TextInput
              placeholder="Nome"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Observação" hint="Opcional">
          <TextInput
            placeholder="Detalhes adicionais"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
        <Field label="Comprovante" hint="Opcional (imagem ou PDF)">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-muted file:px-4 file:py-2 file:text-sm file:font-semibold file:text-foreground hover:file:bg-muted/70"
          />
        </Field>
        <ErrorText message={error} />
        <div className="flex gap-2 pt-2">
          <GhostButton className="flex-1" onClick={onClose} disabled={saving}>
            Cancelar
          </GhostButton>
          <PrimaryButton className="flex-1" onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Registrar despesa
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  )
}

/* ---------- Modal de fechamento ---------- */
export function CloseRegisterDialog({
  registerId,
  openingAmount,
  movements,
  onClose,
  onClosed,
}: {
  registerId: string
  openingAmount: number
  movements: CashMovement[]
  onClose: () => void
  onClosed: () => void
}) {
  const summary = summarizeMovements(openingAmount, movements)
  const [countedCash, setCountedCash] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const difference = countedCash - summary.expectedCash

  async function submit() {
    setError(null)
    setSaving(true)
    try {
      await closeRegister({ registerId, countedCash, notes })
      onClosed()
      onClose()
    } catch (e: any) {
      setError(e.message || 'Não foi possível fechar o caixa.')
    } finally {
      setSaving(false)
    }
  }

  const rows: { label: string; value: number; tone?: 'out' }[] = [
    { label: 'Troco inicial', value: summary.openingAmount },
    { label: 'Vendas em dinheiro', value: summary.salesCash },
    { label: 'Vendas em PIX', value: summary.salesPix },
    { label: 'Vendas em cartão', value: summary.salesCard },
    { label: 'Suprimentos', value: summary.supply },
    { label: 'Sangrias', value: summary.withdrawal, tone: 'out' },
    { label: 'Despesas', value: summary.expense, tone: 'out' },
    { label: 'Estornos', value: summary.refund, tone: 'out' },
  ]

  return (
    <ModalShell title="Fechamento de caixa" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-border">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between border-b border-border px-4 py-2.5 text-sm last:border-0"
            >
              <span className="text-muted-foreground">{r.label}</span>
              <span
                className={
                  r.tone === 'out'
                    ? 'font-semibold text-destructive'
                    : 'font-semibold text-foreground'
                }
              >
                {r.tone === 'out' ? '- ' : ''}
                {formatBRL(r.value)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between bg-muted/50 px-4 py-3">
            <span className="font-bold text-foreground">
              Saldo esperado em dinheiro
            </span>
            <span className="font-bold text-foreground">
              {formatBRL(summary.expectedCash)}
            </span>
          </div>
        </div>

        <Field label="Valor contado no caixa (R$)">
          <MoneyInput
            value={countedCash}
            onValueChange={(n) => setCountedCash(n ?? 0)}
          />
        </Field>

        <div
          className={
            'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold ' +
            (difference === 0
              ? 'bg-muted text-foreground'
              : difference > 0
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-destructive/10 text-destructive')
          }
        >
          <span>Diferença (contado − esperado)</span>
          <span>
            {difference > 0 ? '+' : ''}
            {formatBRL(difference)}
          </span>
        </div>

        <Field label="Observação do fechamento" hint="Opcional">
          <TextInput
            placeholder="Ex.: diferença por troco"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>

        <ErrorText message={error} />
        <div className="flex gap-2 pt-2">
          <GhostButton className="flex-1" onClick={onClose} disabled={saving}>
            Cancelar
          </GhostButton>
          <PrimaryButton className="flex-1" onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Fechar caixa
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  )
}
