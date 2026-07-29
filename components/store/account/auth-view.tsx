'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  TriangleAlert,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { WhatsAppIcon } from '@/components/store/whatsapp-icon'
import { WHATSAPP_URL } from './account-data'
import { ChildrenFields, type ChildDraft } from './children-fields'

type Mode = 'login' | 'cadastro' | 'recuperar'

function Field({
  id,
  label,
  type = 'text',
  placeholder,
  icon: Icon,
  autoComplete,
  value,
  onChange,
  required,
}: {
  id: string
  label: string
  type?: string
  placeholder?: string
  icon: React.ComponentType<{ className?: string }>
  autoComplete?: string
  value: string
  onChange: (v: string) => void
  required?: boolean
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (show ? 'text' : 'password') : type

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full rounded-2xl border border-input bg-card pl-10 pr-11 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {show ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export function AuthView({ onAuthenticated }: { onAuthenticated?: () => void }) {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [children, setChildren] = useState<ChildDraft[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [resendEmail, setResendEmail] = useState<string | null>(null)

  function switchMode(m: Mode) {
    setMode(m)
    setError(null)
    setSuccess(null)
    setResendEmail(null)
  }

  async function handleLogin() {
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (signInError) {
      if (signInError.message.toLowerCase().includes('email not confirmed')) {
        setResendEmail(email.trim())
        throw new Error(
          'Seu e-mail ainda não foi confirmado. Confirme pelo link enviado ou reenvie abaixo.',
        )
      }
      throw new Error('E-mail ou senha incorretos. Tente novamente.')
    }
    onAuthenticated?.()
  }

  async function handleResendConfirmation() {
    if (!resendEmail) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const supabase = createClient()
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/conta`,
        },
      })
      if (resendError) {
        throw new Error(
          'Não foi possível reenviar agora. Aguarde alguns instantes e tente de novo.',
        )
      }
      setResendEmail(null)
      setSuccess(
        'Reenviamos o e-mail de confirmação. Verifique sua caixa de entrada e a pasta de spam.',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup() {
    if (name.trim().length < 2) {
      throw new Error('Informe seu nome completo.')
    }
    if (password.length < 6) {
      throw new Error('A senha precisa ter pelo menos 6 caracteres.')
    }
    const supabase = createClient()
    const trimmed = name.trim()
    const firstName = trimmed.split(' ')[0]
    const lastName = trimmed.split(' ').slice(1).join(' ')
    const validChildren = children
      .filter((c) => c.childName.trim())
      .map((c) => ({
        childName: c.childName.trim(),
        birthDate: c.birthDate,
        preferredStyle: c.preferredStyle,
      }))

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/conta`,
        data: {
          full_name: trimmed,
          first_name: firstName,
          last_name: lastName,
          phone: phone.trim(),
          // Preserva as crianças até a confirmação do e-mail; descarregadas no
          // primeiro acesso autenticado por flushPendingChildren().
          pending_children: validChildren,
        },
      },
    })
    if (signUpError) {
      const msg = signUpError.message.toLowerCase()
      if (
        msg.includes('already registered') ||
        msg.includes('already been registered')
      ) {
        throw new Error('Este e-mail já está cadastrado. Faça login.')
      }
      if (msg.includes('invalid') && msg.includes('email')) {
        throw new Error('Informe um e-mail válido.')
      }
      if (msg.includes('rate limit') || msg.includes('email rate')) {
        throw new Error(
          'Muitas solicitações em pouco tempo. Aguarde alguns minutos e tente novamente. Se persistir, o envio de e-mails precisa ser configurado (veja o suporte).',
        )
      }
      if (msg.includes('password')) {
        throw new Error('A senha precisa ter pelo menos 6 caracteres.')
      }
      throw new Error('Não foi possível criar sua conta. Tente novamente.')
    }

    // Confirmação desativada: já existe sessão. As crianças (em pending_children)
    // são persistidas por flushPendingChildren() ao carregar a conta.
    if (data.session) {
      onAuthenticated?.()
      return
    }

    // Confirmação ativa: sem sessão ainda. O cliente confirma pelo e-mail e as
    // crianças são gravadas no primeiro acesso autenticado.
    setSuccess(
      'Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme para acessar sua conta.',
    )
  }

  async function handleRecover() {
    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/conta/atualizar-senha`,
      },
    )
    if (resetError) {
      throw new Error('Não foi possível enviar o e-mail de recuperação.')
    }
    setSuccess(
      'Enviamos um link para redefinir sua senha. Verifique seu e-mail.',
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      if (mode === 'login') await handleLogin()
      else if (mode === 'cadastro') await handleSignup()
      else await handleRecover()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 lg:py-16">
      <div className="mb-6 text-center">
        <h1 className="text-balance font-serif text-3xl font-semibold text-foreground">
          Minha Conta
        </h1>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
          {mode === 'login'
            ? 'Que bom te ver de novo! Acesse para acompanhar seus pedidos.'
            : mode === 'cadastro'
              ? 'Crie sua conta e aproveite uma experiência feita com carinho.'
              : 'Informe seu e-mail e enviaremos um link para redefinir a senha.'}
        </p>
      </div>

      {/* Toggle (login/cadastro) */}
      {mode !== 'recuperar' && (
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
          {(['login', 'cadastro'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={cn(
                'h-10 rounded-full text-sm font-bold capitalize transition-colors',
                mode === m
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {m === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div
          role="status"
          className="mb-4 flex items-start gap-2 rounded-2xl border border-whatsapp/30 bg-whatsapp/10 px-4 py-3 text-sm text-foreground"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-whatsapp" />
          <span>{success}</span>
        </div>
      )}
      {resendEmail && (
        <button
          type="button"
          onClick={handleResendConfirmation}
          disabled={loading}
          className="mb-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/5 text-sm font-bold text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Mail className="h-4 w-4" />
          {loading ? 'Enviando...' : 'Reenviar e-mail de confirmação'}
        </button>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
      >
        {mode === 'cadastro' && (
          <Field
            id="name"
            label="Nome completo"
            placeholder="Como podemos te chamar?"
            icon={User}
            autoComplete="name"
            value={name}
            onChange={setName}
            required
          />
        )}
        <Field
          id="email"
          label="E-mail"
          type="email"
          placeholder="voce@email.com"
          icon={Mail}
          autoComplete="email"
          value={email}
          onChange={setEmail}
          required
        />
        {mode === 'cadastro' && (
          <Field
            id="phone"
            label="WhatsApp"
            type="tel"
            placeholder="(38) 99999-0000"
            icon={Phone}
            autoComplete="tel"
            value={phone}
            onChange={setPhone}
          />
        )}
        {mode !== 'recuperar' && (
          <Field
            id="password"
            label="Senha"
            type="password"
            placeholder="Digite sua senha"
            icon={Lock}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={setPassword}
            required
          />
        )}

        {mode === 'cadastro' && (
          <>
            <div className="my-1 border-t border-border" />
            <ChildrenFields
              idPrefix="signup-child"
              value={children}
              onChange={setChildren}
            />
          </>
        )}

        {mode === 'login' && (
          <div className="flex items-center justify-end text-sm">
            <button
              type="button"
              onClick={() => switchMode('recuperar')}
              className="font-semibold text-primary hover:underline"
            >
              Esqueci a senha
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 inline-flex h-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? 'Aguarde...'
            : mode === 'login'
              ? 'Entrar na minha conta'
              : mode === 'cadastro'
                ? 'Criar minha conta'
                : 'Enviar link de recuperação'}
        </button>

        {mode === 'recuperar' && (
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="text-center text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Voltar para o login
          </button>
        )}

        {mode === 'cadastro' && (
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Ao criar a conta você concorda com nossos Termos de Uso e Política
            de Privacidade.
          </p>
        )}
      </form>

      <div className="mt-6 flex flex-col items-center gap-3 text-center">
        <span className="text-sm text-muted-foreground">
          Precisa de ajuda para entrar?
        </span>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-whatsapp px-5 text-sm font-bold text-whatsapp-foreground transition-transform hover:brightness-105 active:scale-[0.99]"
        >
          <WhatsAppIcon className="h-4 w-4" />
          Falar com o suporte
        </a>
      </div>
    </div>
  )
}
