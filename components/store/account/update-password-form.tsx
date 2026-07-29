'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  TriangleAlert,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Status = 'checking' | 'ready' | 'invalid' | 'done'

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full rounded-2xl border border-input bg-card pl-10 pr-11 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Digite a nova senha"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

export function UpdatePasswordForm() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // O callback já validou o link e criou a sessão de recuperação (cookies).
  // Aqui só confirmamos que existe um usuário autenticado.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data, error: userError }) => {
      setStatus(data.user && !userError ? 'ready' : 'invalid')
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })
      if (updateError) {
        throw new Error(
          'Não foi possível atualizar sua senha. O link pode ter expirado.',
        )
      }
      setStatus('done')
      setTimeout(() => router.push('/conta'), 2200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'checking') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Validando seu link...</p>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="mx-auto max-w-md px-4 py-10 lg:py-16">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <TriangleAlert className="h-10 w-10 text-destructive" />
          <h1 className="text-balance font-serif text-2xl font-semibold text-foreground">
            Link inválido ou expirado
          </h1>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            O link de redefinição de senha não é mais válido. Solicite um novo
            para continuar.
          </p>
          <Link
            href="/conta"
            className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Solicitar novo link
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="mx-auto max-w-md px-4 py-10 lg:py-16">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <CheckCircle2 className="h-10 w-10 text-whatsapp" />
          <h1 className="text-balance font-serif text-2xl font-semibold text-foreground">
            Senha atualizada!
          </h1>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            Tudo certo. Você já pode acessar sua conta com a nova senha.
            Redirecionando...
          </p>
          <Link
            href="/conta"
            className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir para minha conta
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 lg:py-16">
      <div className="mb-6 text-center">
        <h1 className="text-balance font-serif text-3xl font-semibold text-foreground">
          Criar nova senha
        </h1>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
          Escolha uma nova senha para acessar sua conta com segurança.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
      >
        <PasswordField
          id="new-password"
          label="Nova senha"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <PasswordField
          id="confirm-password"
          label="Confirmar nova senha"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-1 inline-flex h-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Salvando...' : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  )
}
