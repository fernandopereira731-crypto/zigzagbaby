'use client'

import { useState } from 'react'
import { LogOut, Shield, Check, Loader2 } from 'lucide-react'
import { useAdminAuth } from '../auth/auth-context'
import { Panel, Field, TextInput, PrimaryButton } from '../ui'

export function AdminAccount({ onLogout }: { onLogout: () => void }) {
  const { user, updateProfile, isMock } = useAdminAuth()

  const [fullName, setFullName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const initial = (fullName || user?.name || 'A').charAt(0).toUpperCase()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)

    if (password && password !== confirmPassword) {
      setFeedback({ type: 'error', message: 'As senhas não coincidem.' })
      return
    }

    setSaving(true)
    const result = await updateProfile({
      fullName,
      email,
      password: password || undefined,
    })
    setSaving(false)

    if (result.error) {
      setFeedback({ type: 'error', message: result.error })
      return
    }

    setPassword('')
    setConfirmPassword('')
    setFeedback({
      type: 'success',
      message: 'Alterações salvas com sucesso.',
    })
  }

  return (
    <div className="space-y-5">
      <Panel className="flex items-center gap-4 p-5">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-extrabold text-primary-foreground">
          {initial}
        </span>
        <div>
          <h2 className="font-serif text-xl font-semibold text-foreground">
            {fullName || 'Administrador'}
          </h2>
          <p className="text-sm text-muted-foreground">{email}</p>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            <Shield className="h-3.5 w-3.5" />
            Administrador
          </span>
        </div>
      </Panel>

      {isMock && (
        <p className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          Modo de demonstração: as alterações não são persistidas até o Supabase
          estar conectado.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Panel className="space-y-4 p-5">
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Dados de acesso
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo">
              <TextInput
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </Field>
            <Field label="E-mail">
              <TextInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
          </div>
        </Panel>

        <Panel className="space-y-4 p-5">
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Alterar senha
          </h3>
          <p className="text-sm text-muted-foreground">
            Deixe em branco para manter a senha atual.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nova senha">
              <TextInput
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirmar senha">
              <TextInput
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
          </div>
        </Panel>

        {feedback && (
          <p
            role="status"
            className={
              feedback.type === 'success'
                ? 'rounded-xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary'
                : 'rounded-xl bg-secondary/15 px-4 py-3 text-sm font-semibold text-secondary-foreground'
            }
          >
            {feedback.message}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-input px-5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" />
            Sair do painel
          </button>
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Salvar alterações
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}
