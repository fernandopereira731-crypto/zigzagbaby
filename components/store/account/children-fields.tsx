'use client'

import { useState } from 'react'
import { Baby, Info, Plus, Trash2 } from 'lucide-react'
import {
  CHILDREN_HINT,
  preferredStyleOptions,
  type PreferredStyle,
} from '@/lib/children-profiles'

export type ChildDraft = {
  key: string
  childName: string
  birthDate: string
  preferredStyle: PreferredStyle
}

let counter = 0
function makeKey() {
  counter += 1
  return `child-${Date.now()}-${counter}`
}

export function toChildDraft(child: {
  id: string
  childName: string
  birthDate: string
  preferredStyle: PreferredStyle
}): ChildDraft {
  return {
    key: child.id,
    childName: child.childName,
    birthDate: child.birthDate,
    preferredStyle: child.preferredStyle,
  }
}

export function emptyChildDraft(): ChildDraft {
  return {
    key: makeKey(),
    childName: '',
    birthDate: '',
    preferredStyle: 'nao-informar',
  }
}

/**
 * Campos de crianças reutilizáveis (cadastro e Dados pessoais).
 *
 * Pode operar de dois modos:
 * - Controlado: quando `value` e `onChange` são passados (usado quando o
 *   componente pai precisa persistir o array em children_profiles).
 * - Não controlado: mantém estado interno seeded por `initial` (uso simples).
 */
export function ChildrenFields({
  initial,
  value,
  onChange,
  idPrefix = 'child',
}: {
  initial?: ChildDraft[]
  value?: ChildDraft[]
  onChange?: (children: ChildDraft[]) => void
  idPrefix?: string
}) {
  const isControlled = value !== undefined && onChange !== undefined
  const [internal, setInternal] = useState<ChildDraft[]>(initial ?? [])
  const children = isControlled ? (value as ChildDraft[]) : internal

  function commit(next: ChildDraft[]) {
    if (isControlled) onChange!(next)
    else setInternal(next)
  }

  function update(key: string, patch: Partial<ChildDraft>) {
    commit(children.map((c) => (c.key === key ? { ...c, ...patch } : c)))
  }

  function addChild() {
    commit([...children, emptyChildDraft()])
  }

  function removeChild(key: string) {
    commit(children.filter((c) => c.key !== key))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Baby className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Filhos{' '}
            <span className="font-medium text-muted-foreground">
              (opcional)
            </span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Adicione uma ou mais crianças.
          </p>
        </div>
      </div>

      {children.map((child, index) => (
        <div
          key={child.key}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/30 p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Criança {index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeChild(child.key)}
              aria-label={`Remover criança ${index + 1}`}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`${idPrefix}-name-${child.key}`}
              className="text-sm font-semibold text-foreground"
            >
              Nome da criança
            </label>
            <input
              id={`${idPrefix}-name-${child.key}`}
              type="text"
              value={child.childName}
              onChange={(e) => update(child.key, { childName: e.target.value })}
              placeholder="Ex.: Helena"
              className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`${idPrefix}-birth-${child.key}`}
                className="text-sm font-semibold text-foreground"
              >
                Data de nascimento
              </label>
              <input
                id={`${idPrefix}-birth-${child.key}`}
                type="date"
                value={child.birthDate}
                onChange={(e) =>
                  update(child.key, { birthDate: e.target.value })
                }
                className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`${idPrefix}-style-${child.key}`}
                className="text-sm font-semibold text-foreground"
              >
                Gênero/estilo preferido
              </label>
              <select
                id={`${idPrefix}-style-${child.key}`}
                value={child.preferredStyle}
                onChange={(e) =>
                  update(child.key, {
                    preferredStyle: e.target.value as PreferredStyle,
                  })
                }
                className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {preferredStyleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addChild}
        className="flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-sm font-bold text-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
      >
        <Plus className="h-5 w-5" />
        {children.length === 0 ? 'Adicionar criança' : 'Adicionar outra criança'}
      </button>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {CHILDREN_HINT}
      </p>
    </div>
  )
}
