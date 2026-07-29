'use client'

import { useEffect, useState } from 'react'
import {
  Plus,
  Tags,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Panel, PrimaryButton, GhostButton, IconAction, TextInput } from '../ui'
import {
  listCategories,
  createCategory,
  updateCategory,
  toggleCategory,
  deleteCategory,
  swapCategoryOrder,
  type AdminCategoryRow,
} from '../categories-service'

export function Categories() {
  const [categories, setCategories] = useState<AdminCategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  // Edição inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  // Confirmação de exclusão
  const [deleteTarget, setDeleteTarget] = useState<AdminCategoryRow | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setCategories(await listCategories())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar categorias.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setSaving(true)
    setActionError(null)
    try {
      await createCategory({ name })
      setNewName('')
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao criar categoria.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(cat: AdminCategoryRow) {
    setBusyId(cat.id)
    setActionError(null)
    try {
      await toggleCategory(cat.id, !cat.isActive)
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c)),
      )
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao atualizar.')
    } finally {
      setBusyId(null)
    }
  }

  function startEdit(cat: AdminCategoryRow) {
    setEditingId(cat.id)
    setEditName(cat.name)
    setActionError(null)
  }

  async function saveEdit(cat: AdminCategoryRow) {
    const name = editName.trim()
    if (!name) return
    setBusyId(cat.id)
    setActionError(null)
    try {
      await updateCategory(cat.id, { name })
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, name } : c)),
      )
      setEditingId(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setBusyId(null)
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= categories.length) return
    const a = categories[index]
    const b = categories[target]
    setBusyId(a.id)
    setActionError(null)
    try {
      await swapCategoryOrder(
        { id: a.id, sortOrder: a.sortOrder },
        { id: b.id, sortOrder: b.sortOrder },
      )
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao reordenar.')
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setBusyId(deleteTarget.id)
    setActionError(null)
    try {
      await deleteCategory(deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao excluir.')
      setDeleteTarget(null)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Carregando categorias...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <AlertCircle className="h-6 w-6" />
        </span>
        <p className="text-sm font-semibold text-foreground">{error}</p>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <RefreshCw className="h-4 w-4" /> Recarregar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <h3 className="mb-3 font-serif text-lg font-semibold text-foreground">
          Nova categoria
        </h3>
        <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row">
          <TextInput
            placeholder="Nome da categoria"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={saving}
          />
          <PrimaryButton type="submit" className="shrink-0" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Adicionar
          </PrimaryButton>
        </form>
      </Panel>

      {actionError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-secondary bg-secondary/30 px-4 py-3 text-sm text-secondary-foreground"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {categories.length === 0 ? (
        <Panel className="p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma categoria cadastrada ainda.
          </p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => (
            <Panel key={c.id} className="flex items-center gap-3 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Tags className="h-5 w-5" />
              </span>

              <div className="min-w-0 flex-1">
                {editingId === c.id ? (
                  <div className="flex items-center gap-1.5">
                    <TextInput
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-9"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing)
                          saveEdit(c)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                    />
                    <IconAction
                      label="Salvar"
                      onClick={() => saveEdit(c)}
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <Check className="h-4 w-4" />
                    </IconAction>
                    <IconAction label="Cancelar" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4" />
                    </IconAction>
                  </div>
                ) : (
                  <>
                    <p className="truncate font-semibold text-foreground">
                      {c.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.productCount}{' '}
                      {c.productCount === 1 ? 'produto' : 'produtos'}
                      {!c.isActive && ' · inativa'}
                    </p>
                  </>
                )}
              </div>

              {editingId !== c.id && (
                <>
                  <div className="flex flex-col">
                    <IconAction
                      label="Mover para cima"
                      onClick={() => move(i, -1)}
                      className="h-6 w-6 disabled:opacity-30"
                      disabled={i === 0 || busyId === c.id}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </IconAction>
                    <IconAction
                      label="Mover para baixo"
                      onClick={() => move(i, 1)}
                      className="h-6 w-6 disabled:opacity-30"
                      disabled={i === categories.length - 1 || busyId === c.id}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </IconAction>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={c.isActive}
                    aria-label={`${c.isActive ? 'Desativar' : 'Ativar'} ${c.name}`}
                    onClick={() => handleToggle(c)}
                    disabled={busyId === c.id}
                    className={cn(
                      'relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50',
                      c.isActive ? 'bg-primary' : 'bg-muted',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform',
                        c.isActive ? 'translate-x-5' : 'translate-x-0.5',
                      )}
                    />
                  </button>

                  <div className="flex gap-1">
                    <IconAction label="Editar" onClick={() => startEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </IconAction>
                    <IconAction
                      label="Excluir"
                      onClick={() => setDeleteTarget(c)}
                      className="hover:bg-secondary hover:text-secondary-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconAction>
                  </div>
                </>
              )}
            </Panel>
          ))}
        </div>
      )}

      {/* Confirmação de exclusão */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-lg font-semibold text-foreground">
              Excluir categoria
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tem certeza que deseja excluir{' '}
              <span className="font-semibold text-foreground">
                {deleteTarget.name}
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
