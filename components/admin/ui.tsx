'use client'

import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from 'react'
import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/format'

export function Panel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-background shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function StatusBadge({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold',
        className,
      )}
    >
      {label}
    </span>
  )
}

export function SearchInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn('relative flex-1', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        {...props}
        className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  )
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'h-11 rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20',
        className,
      )}
    >
      {children}
    </select>
  )
}

export function PrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-full border border-input bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function IconAction({
  children,
  label,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string
  children: ReactNode
  hint?: string
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-sm font-semibold text-foreground">{label}</label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20',
        className,
      )}
    />
  )
}

/**
 * Converte um texto no padrão brasileiro para número decimal.
 * Aceita "49,90", "49.90", "49", "1.234,56" e "R$ 49,90".
 */
export function parseMoney(value: string): number {
  if (!value) return 0
  let s = value.trim().replace(/\s/g, '').replace(/[^\d.,-]/g, '')
  if (!s) return 0
  if (s.includes('.') && s.includes(',')) {
    // Ponto = separador de milhar, vírgula = decimal.
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (s.includes(',')) {
    s = s.replace(',', '.')
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

// Representação editável (sem "R$"), com vírgula decimal e 2 casas.
function formatDecimalBR(n: number): string {
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function displayMoney(n: number | null | undefined, currency: boolean): string {
  if (n == null || n === 0) return ''
  return currency ? formatBRL(n) : formatDecimalBR(n)
}

type MoneyInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'type'
> & {
  /** Valor controlado (número). Use junto com onValueChange. */
  value?: number | null
  /** Valor inicial para uso não-controlado (ex.: formulários de demonstração). */
  defaultValue?: number | null
  /** Recebe o valor já convertido para decimal (ou null quando vazio). */
  onValueChange?: (value: number | null) => void
  /** Exibe formatado como moeda (R$) ao sair do campo. Padrão: true. */
  currency?: boolean
  /** Quando vazio, reporta null em vez de 0. Padrão: false. */
  allowNull?: boolean
}

/**
 * Campo monetário no padrão brasileiro.
 * - Durante a digitação preserva o texto (permite vírgula normalmente).
 * - Converte automaticamente para decimal ao reportar o valor.
 * - Ao sair do campo, exibe formatado como moeda (R$ 49,90) quando apropriado.
 */
export function MoneyInput({
  value,
  defaultValue,
  onValueChange,
  currency = true,
  allowNull = false,
  ...props
}: MoneyInputProps) {
  const isControlled = value !== undefined
  const [focused, setFocused] = useState(false)
  const [text, setText] = useState<string>(() =>
    displayMoney(value ?? defaultValue ?? null, currency),
  )

  // Sincroniza a exibição quando o valor controlado muda (ex.: carregar edição).
  useEffect(() => {
    if (!isControlled || focused) return
    setText(displayMoney(value, currency))
  }, [value, focused, isControlled, currency])

  return (
    <TextInput
      {...props}
      type="text"
      inputMode="decimal"
      value={text}
      onFocus={(e) => {
        setFocused(true)
        const n = isControlled ? (value ?? 0) : parseMoney(text)
        setText(n === 0 ? '' : formatDecimalBR(n))
        props.onFocus?.(e)
      }}
      onChange={(e) => {
        // Permite apenas dígitos, vírgula, ponto e espaço enquanto digita.
        const cleaned = e.target.value.replace(/[^\d.,\s]/g, '')
        setText(cleaned)
        if (cleaned.trim() === '') {
          onValueChange?.(allowNull ? null : 0)
        } else {
          onValueChange?.(parseMoney(cleaned))
        }
      }}
      onBlur={(e) => {
        setFocused(false)
        setText(text.trim() === '' ? '' : displayMoney(parseMoney(text), currency))
        props.onBlur?.(e)
      }}
    />
  )
}
