'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import {
  Loader2,
  AlertCircle,
  Plus,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  ShoppingCart,
  Receipt,
  LockKeyhole,
  History,
  RefreshCw,
} from 'lucide-react'
import { formatBRL } from '@/lib/format'
import {
  Panel,
  Field,
  MoneyInput,
  TextInput,
  Select,
  PrimaryButton,
  GhostButton,
  StatusBadge,
} from '../ui'
import {
  getOpenRegister,
  listOperators,
  listMovements,
  openRegister,
  summarizeMovements,
  listImportableOrders,
  importOrderSale,
  movementLabels,
  type Operator,
  type CashRegister,
  type CashMovement,
} from '../cash-service'
import { CashReports } from './cash-reports'
import { MovementDialog, ExpenseDialog, CloseRegisterDialog } from './cash-dialogs'

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function Cash() {
  const [tab, setTab] = useState<'operar' | 'relatorios'>('operar')

  return (
    <div className="space-y-5">
      {/* Abas */}
      <div className="flex gap-2 rounded-full border border-border bg-background p-1">
        <TabButton
          active={tab === 'operar'}
          onClick={() => setTab('operar')}
          label="Operar caixa"
        />
        <TabButton
          active={tab === 'relatorios'}
          onClick={() => setTab('relatorios')}
          label="Relatórios"
        />
      </div>

      {tab === 'operar' ? <OperateCash /> : <CashReports />}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex-1 rounded-full py-2 text-sm font-bold transition-colors ' +
        (active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted')
      }
    >
      {label}
    </button>
  )
}

/* ============================================================
 * Operar caixa
 * ========================================================== */
function OperateCash() {
  const {
    data: register,
    error,
    isLoading,
    mutate,
  } = useSWR<CashRegister | null>('open-register', getOpenRegister)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Panel className="flex items-center gap-3 p-5 text-sm text-destructive">
        <AlertCircle className="h-5 w-5 shrink-0" />
        Não foi possível carregar o caixa. Verifique sua permissão de acesso.
      </Panel>
    )
  }

  if (!register) {
    return <OpenRegisterForm onOpened={() => mutate()} />
  }

  return <OpenRegisterPanel register={register} onChanged={() => mutate()} />
}

/* ---------- Abertura ---------- */
function OpenRegisterForm({ onOpened }: { onOpened: () => void }) {
  const { data: operators } = useSWR<Operator[]>('operators', listOperators)
  const [operatorId, setOperatorId] = useState('')
  const [openingAmount, setOpeningAmount] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pré-seleciona o primeiro operador disponível.
  useEffect(() => {
    if (!operatorId && operators && operators.length > 0) {
      setOperatorId(operators[0].id)
    }
  }, [operators, operatorId])

  async function submit() {
    setError(null)
    const op = operators?.find((o) => o.id === operatorId)
    if (!op) {
      setError('Selecione um operador.')
      return
    }
    setSaving(true)
    try {
      await openRegister({
        operatorId: op.id,
        operatorName: op.fullName,
        openingAmount,
        notes,
      })
      onOpened()
    } catch (e: any) {
      setError(e.message || 'Não foi possível abrir o caixa.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel className="mx-auto max-w-lg p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Wallet className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-serif text-lg font-semibold text-foreground">
            Abrir caixa
          </h2>
          <p className="text-sm text-muted-foreground">
            Data e horário registrados automaticamente.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Field label="Operador">
          <Select
            className="w-full"
            value={operatorId}
            onChange={(e) => setOperatorId(e.target.value)}
          >
            {(operators ?? []).length === 0 && (
              <option value="">Nenhum operador disponível</option>
            )}
            {(operators ?? []).map((o) => (
              <option key={o.id} value={o.id}>
                {o.fullName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Valor inicial de troco (R$)">
          <MoneyInput
            value={openingAmount}
            onValueChange={(n) => setOpeningAmount(n ?? 0)}
          />
        </Field>
        <Field label="Observação" hint="Opcional">
          <TextInput
            placeholder="Ex.: turno da manhã"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
        {error && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        <PrimaryButton className="w-full" onClick={submit} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Abrir caixa
        </PrimaryButton>
      </div>
    </Panel>
  )
}

/* ---------- Painel do caixa aberto ---------- */
function OpenRegisterPanel({
  register,
  onChanged,
}: {
  register: CashRegister
  onChanged: () => void
}) {
  const {
    data: movements,
    isLoading,
    mutate,
  } = useSWR<CashMovement[]>(['movements', register.id], () =>
    listMovements(register.id),
  )

  const [dialog, setDialog] = useState<
    'movement' | 'expense' | 'import' | 'close' | null
  >(null)

  const summary = useMemo(
    () => summarizeMovements(register.openingAmount, movements ?? []),
    [register.openingAmount, movements],
  )

  function refreshAll() {
    mutate()
    onChanged()
  }

  return (
    <div className="space-y-5">
      {/* Cabeçalho do caixa */}
      <Panel className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-semibold text-foreground">
                  {register.operatorName}
                </h2>
                <StatusBadge
                  label="Aberto"
                  className="bg-emerald-500/15 text-emerald-600"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Aberto em {fmtDateTime(register.openedAt)}
              </p>
            </div>
          </div>
          <PrimaryButton
            onClick={() => setDialog('close')}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            <LockKeyhole className="h-4 w-4" />
            Fechar caixa
          </PrimaryButton>
        </div>
      </Panel>

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Saldo em dinheiro"
          value={summary.expectedCash}
          icon={<Wallet className="h-4 w-4" />}
          highlight
        />
        <SummaryCard
          label="Total de entradas"
          value={summary.totalIn}
          icon={<ArrowDownCircle className="h-4 w-4" />}
          tone="in"
        />
        <SummaryCard
          label="Total de saídas"
          value={summary.totalOut}
          icon={<ArrowUpCircle className="h-4 w-4" />}
          tone="out"
        />
        <SummaryCard
          label="Troco inicial"
          value={summary.openingAmount}
          icon={<Wallet className="h-4 w-4" />}
        />
      </div>

      {/* Vendas por forma */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Dinheiro" value={summary.salesCash} />
        <MiniStat label="PIX" value={summary.salesPix} />
        <MiniStat label="Cartão" value={summary.salesCard} />
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-2">
        <PrimaryButton onClick={() => setDialog('movement')}>
          <Plus className="h-4 w-4" />
          Movimentação
        </PrimaryButton>
        <GhostButton onClick={() => setDialog('expense')}>
          <Receipt className="h-4 w-4" />
          Despesa
        </GhostButton>
        <GhostButton onClick={() => setDialog('import')}>
          <ShoppingCart className="h-4 w-4" />
          Importar venda
        </GhostButton>
      </div>

      {/* Lista de movimentações */}
      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <History className="h-4 w-4 text-muted-foreground" />
            Movimentações
          </h3>
          <button
            type="button"
            aria-label="Atualizar"
            onClick={refreshAll}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (movements ?? []).length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            Nenhuma movimentação registrada ainda.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {(movements ?? []).map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {movementLabels[m.type]}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {fmtDateTime(m.createdAt)}
                    {m.description ? ` · ${m.description}` : ''}
                  </p>
                </div>
                <span
                  className={
                    'shrink-0 font-bold ' +
                    (m.direction === 'in'
                      ? 'text-emerald-600'
                      : 'text-destructive')
                  }
                >
                  {m.direction === 'in' ? '+' : '-'}
                  {formatBRL(m.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Modais */}
      {dialog === 'movement' && (
        <MovementDialog
          registerId={register.id}
          onClose={() => setDialog(null)}
          onSaved={refreshAll}
        />
      )}
      {dialog === 'expense' && (
        <ExpenseDialog
          registerId={register.id}
          onClose={() => setDialog(null)}
          onSaved={refreshAll}
        />
      )}
      {dialog === 'import' && (
        <ImportOrdersDialog
          registerId={register.id}
          onClose={() => setDialog(null)}
          onSaved={refreshAll}
        />
      )}
      {dialog === 'close' && (
        <CloseRegisterDialog
          registerId={register.id}
          openingAmount={register.openingAmount}
          movements={movements ?? []}
          onClose={() => setDialog(null)}
          onClosed={refreshAll}
        />
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
  highlight,
}: {
  label: string
  value: number
  icon: React.ReactNode
  tone?: 'in' | 'out'
  highlight?: boolean
}) {
  const valueColor =
    tone === 'in'
      ? 'text-emerald-600'
      : tone === 'out'
        ? 'text-destructive'
        : 'text-foreground'
  return (
    <Panel className={highlight ? 'p-4 ring-2 ring-primary/30' : 'p-4'}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={'mt-1 text-lg font-bold ' + valueColor}>
        {formatBRL(value)}
      </p>
    </Panel>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-center">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">{formatBRL(value)}</p>
    </div>
  )
}

/* ---------- Modal: importar vendas dos pedidos ---------- */
function ImportOrdersDialog({
  registerId,
  onClose,
  onSaved,
}: {
  registerId: string
  onClose: () => void
  onSaved: () => void
}) {
  const { data: orders, isLoading, mutate } = useSWR(
    'importable-orders',
    listImportableOrders,
  )
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function importOne(orderId: string) {
    const order = orders?.find((o) => o.id === orderId)
    if (!order) return
    setBusyId(orderId)
    setError(null)
    try {
      await importOrderSale(registerId, order)
      await mutate()
      onSaved()
    } catch (e: any) {
      setError(e.message || 'Não foi possível importar o pedido.')
    } finally {
      setBusyId(null)
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
      <div className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-background shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Importar vendas
          </h3>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <Plus className="h-5 w-5 rotate-45" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          <p className="mb-3 text-sm text-muted-foreground">
            Pedidos pagos da loja ainda não lançados no caixa.
          </p>
          {error && (
            <p className="mb-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (orders ?? []).length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum pedido disponível para importar.
            </p>
          ) : (
            <ul className="space-y-2">
              {(orders ?? []).map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {o.orderNumber}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {o.customerName ?? 'Cliente'} ·{' '}
                      {o.paymentMethod ?? 'pagamento'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-bold text-foreground">
                      {formatBRL(o.total)}
                    </span>
                    <button
                      type="button"
                      onClick={() => importOne(o.id)}
                      disabled={busyId === o.id}
                      className="inline-flex h-8 items-center gap-1 rounded-full bg-primary px-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {busyId === o.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                      Lançar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
