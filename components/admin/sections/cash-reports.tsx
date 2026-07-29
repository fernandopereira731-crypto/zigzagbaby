'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { Loader2, CalendarRange } from 'lucide-react'
import { formatBRL } from '@/lib/format'
import { Panel, Field, TextInput, StatusBadge } from '../ui'
import {
  listRegisters,
  getExpensesByCategory,
  getSalesByOperator,
  getDailyBalance,
  listMovements,
  summarizeMovements,
  expenseCategoryLabels,
  type CashRegister,
} from '../cash-service'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function CashReports() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  // Converte as datas do filtro para ISO (início e fim do dia).
  const filters = useMemo(() => {
    const f: { from?: string; to?: string } = {}
    if (from) f.from = new Date(from + 'T00:00:00').toISOString()
    if (to) f.to = new Date(to + 'T23:59:59').toISOString()
    return f
  }, [from, to])

  return (
    <div className="space-y-5">
      {/* Filtro de período */}
      <Panel className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
            Período
          </span>
          <Field label="De" className="w-36">
            <TextInput
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
          <Field label="Até" className="w-36">
            <TextInput
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
        </div>
      </Panel>

      <DailyBalanceReport filters={filters} />
      <div className="grid gap-5 lg:grid-cols-2">
        <ExpensesByCategoryReport filters={filters} />
        <SalesByOperatorReport filters={filters} />
      </div>
      <RegistersReport />
    </div>
  )
}

function ReportPanel({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-border px-5 py-3">
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </Panel>
  )
}

function Loading() {
  return (
    <div className="flex justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <p className="px-5 py-8 text-center text-sm text-muted-foreground">{text}</p>
  )
}

/* ---------- Saldo diário (entradas e saídas) ---------- */
function DailyBalanceReport({
  filters,
}: {
  filters: { from?: string; to?: string }
}) {
  const { data, isLoading } = useSWR(['daily-balance', filters], () =>
    getDailyBalance(filters),
  )
  return (
    <ReportPanel title="Saldo diário — entradas e saídas">
      {isLoading ? (
        <Loading />
      ) : (data ?? []).length === 0 ? (
        <Empty text="Sem movimentações no período." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Dia</th>
                <th className="px-5 py-2.5 font-semibold">Entradas</th>
                <th className="px-5 py-2.5 font-semibold">Saídas</th>
                <th className="px-5 py-2.5 font-semibold">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data ?? []).map((d) => (
                <tr key={d.day}>
                  <td className="px-5 py-2.5 font-medium text-foreground">
                    {fmtDate(d.day)}
                  </td>
                  <td className="px-5 py-2.5 text-emerald-600">
                    {formatBRL(d.totalIn)}
                  </td>
                  <td className="px-5 py-2.5 text-destructive">
                    {formatBRL(d.totalOut)}
                  </td>
                  <td
                    className={
                      'px-5 py-2.5 font-bold ' +
                      (d.net >= 0 ? 'text-foreground' : 'text-destructive')
                    }
                  >
                    {formatBRL(d.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReportPanel>
  )
}

/* ---------- Despesas por categoria ---------- */
function ExpensesByCategoryReport({
  filters,
}: {
  filters: { from?: string; to?: string }
}) {
  const { data, isLoading } = useSWR(['expenses-cat', filters], () =>
    getExpensesByCategory(filters),
  )
  const total = (data ?? []).reduce((s, r) => s + r.total, 0)
  return (
    <ReportPanel title="Despesas por categoria">
      {isLoading ? (
        <Loading />
      ) : (data ?? []).length === 0 ? (
        <Empty text="Sem despesas no período." />
      ) : (
        <ul className="divide-y divide-border">
          {(data ?? []).map((r) => {
            const pct = total > 0 ? (r.total / total) * 100 : 0
            return (
              <li key={r.category} className="px-5 py-3">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">
                    {expenseCategoryLabels[r.category]}
                  </span>
                  <span className="font-bold text-foreground">
                    {formatBRL(r.total)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            )
          })}
          <li className="flex items-center justify-between bg-muted/40 px-5 py-3">
            <span className="font-bold text-foreground">Total</span>
            <span className="font-bold text-foreground">
              {formatBRL(total)}
            </span>
          </li>
        </ul>
      )}
    </ReportPanel>
  )
}

/* ---------- Vendas por operador ---------- */
function SalesByOperatorReport({
  filters,
}: {
  filters: { from?: string; to?: string }
}) {
  const { data, isLoading } = useSWR(['sales-operator', filters], () =>
    getSalesByOperator(filters),
  )
  return (
    <ReportPanel title="Vendas por operador">
      {isLoading ? (
        <Loading />
      ) : (data ?? []).length === 0 ? (
        <Empty text="Sem caixas fechados no período." />
      ) : (
        <ul className="divide-y divide-border">
          {(data ?? []).map((r) => (
            <li
              key={r.operatorName}
              className="flex items-center justify-between px-5 py-3"
            >
              <div>
                <p className="font-semibold text-foreground">
                  {r.operatorName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.registers} caixa(s) · diferença{' '}
                  <span
                    className={
                      r.differenceTotal === 0
                        ? ''
                        : r.differenceTotal > 0
                          ? 'text-emerald-600'
                          : 'text-destructive'
                    }
                  >
                    {formatBRL(r.differenceTotal)}
                  </span>
                </p>
              </div>
              <span className="font-bold text-foreground">
                {formatBRL(r.salesTotal)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ReportPanel>
  )
}

/* ---------- Caixas abertos e fechados + diferenças ---------- */
function RegistersReport() {
  const { data, isLoading } = useSWR('all-registers', listRegisters)
  return (
    <ReportPanel title="Caixas abertos e fechados">
      {isLoading ? (
        <Loading />
      ) : (data ?? []).length === 0 ? (
        <Empty text="Nenhum caixa registrado." />
      ) : (
        <ul className="divide-y divide-border">
          {(data ?? []).map((r) => (
            <RegisterReportRow key={r.id} register={r} />
          ))}
        </ul>
      )}
    </ReportPanel>
  )
}

function RegisterReportRow({ register }: { register: CashRegister }) {
  const { data: movements } = useSWR(['movements', register.id], () =>
    listMovements(register.id),
  )
  const summary = movements
    ? summarizeMovements(register.openingAmount, movements)
    : null
  const salesTotal = summary
    ? summary.salesCash + summary.salesPix + summary.salesCard
    : 0

  return (
    <li className="px-5 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-foreground">
              {register.operatorName}
            </p>
            <StatusBadge
              label={register.status === 'open' ? 'Aberto' : 'Fechado'}
              className={
                register.status === 'open'
                  ? 'bg-emerald-500/15 text-emerald-600'
                  : 'bg-muted text-muted-foreground'
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {fmtDateTime(register.openedAt)}
            {register.closedAt ? ` → ${fmtDateTime(register.closedAt)}` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Vendas</p>
          <p className="font-bold text-foreground">{formatBRL(salesTotal)}</p>
        </div>
      </div>
    </li>
  )
}
