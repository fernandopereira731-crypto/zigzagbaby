'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Info, AlertCircle } from 'lucide-react'
import { useAdminAuth } from './auth/auth-context'
import { TEST_CREDENTIALS } from './auth/config'

export function AdminLogin() {
  const { signIn, isMock } = useAdminAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState(isMock ? TEST_CREDENTIALS.email : '')
  const [password, setPassword] = useState(isMock ? TEST_CREDENTIALS.password : '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await signIn(email, password)
    if (result.error) {
      setError(result.error)
      setSubmitting(false)
    }
    // Em caso de sucesso, o provider atualiza o status e o painel é exibido.
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/images/logo.png"
            alt="Zig Zag Baby"
            width={741}
            height={672}
            priority
            className="h-16 w-auto"
          />
          <h1 className="mt-4 font-serif text-2xl font-semibold text-foreground">
            Painel Administrativo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesse para gerenciar sua loja
          </p>
        </div>

        {isMock && (
          <div className="mb-4 rounded-2xl border border-accent/40 bg-accent/10 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-accent-foreground">
              <Info className="h-4 w-4" />
              Modo de demonstração
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              O Supabase ainda não está conectado. Use as credenciais de teste
              abaixo para acessar o painel:
            </p>
            <dl className="mt-3 space-y-1.5 rounded-xl bg-background/70 p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Usuário</dt>
                <dd className="font-mono font-semibold text-foreground">
                  {TEST_CREDENTIALS.email}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Senha</dt>
                <dd className="font-mono font-semibold text-foreground">
                  {TEST_CREDENTIALS.password}
                </dd>
              </div>
            </dl>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-border bg-background p-6 shadow-sm sm:p-8"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="admin-email"
              className="text-sm font-semibold text-foreground"
            >
              E-mail
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-password"
              className="text-sm font-semibold text-foreground"
            >
              Senha
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-xl border border-input bg-background pl-11 pr-11 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-input accent-primary"
              />
              Manter conectado
            </label>
            <button
              type="button"
              className="font-semibold text-primary hover:underline"
            >
              Esqueci a senha
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="h-12 w-full rounded-full bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Entrando...' : 'Entrar no painel'}
          </button>

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-whatsapp" />
            {isMock
              ? 'Autenticação real ativada automaticamente ao conectar o Supabase'
              : 'Acesso seguro e criptografado'}
          </p>
        </form>
      </div>
    </div>
  )
}
