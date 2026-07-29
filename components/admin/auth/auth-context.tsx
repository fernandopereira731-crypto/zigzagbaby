'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import {
  isSupabaseConfigured,
  MOCK_ADMIN_USER,
  MOCK_SESSION_KEY,
  TEST_CREDENTIALS,
  type AdminUser,
} from './config'
import { getSupabaseBrowserClient } from './supabase-client'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type SignInResult = { error?: string }

type UpdateProfileInput = {
  fullName: string
  email: string
  password?: string
}

type UpdateProfileResult = { error?: string }

type AdminAuthValue = {
  user: AdminUser | null
  status: AuthStatus
  /** true enquanto usa credenciais de teste (Supabase não conectado). */
  isMock: boolean
  signIn: (email: string, password: string) => Promise<SignInResult>
  signOut: () => Promise<void>
  updateProfile: (input: UpdateProfileInput) => Promise<UpdateProfileResult>
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null)

export function AdminAuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const usingSupabase = isSupabaseConfigured()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  // Restaura a sessão existente ao carregar.
  useEffect(() => {
    let active = true

    async function bootstrap() {
      if (usingSupabase) {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) {
          setStatus('unauthenticated')
          return
        }
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!active) return
        await applySupabaseSession(session)

        // Mantém o painel sincronizado com login/logout.
        supabase.auth.onAuthStateChange((_event, session) => {
          void applySupabaseSession(session)
        })
      } else {
        // Modo de demonstração: sessão persistida em localStorage.
        try {
          const saved =
            typeof window !== 'undefined'
              ? window.localStorage.getItem(MOCK_SESSION_KEY)
              : null
          if (saved) {
            setUser(MOCK_ADMIN_USER)
            setStatus('authenticated')
          } else {
            setStatus('unauthenticated')
          }
        } catch {
          setStatus('unauthenticated')
        }
      }
    }

    async function applySupabaseSession(session: unknown) {
      const s = session as
        | { user?: { id: string; email?: string; user_metadata?: Record<string, unknown> } }
        | null
      if (s?.user) {
        // Só permite o acesso ao painel se o usuário for administrador,
        // ou seja, se possuir um registro em admin_profiles. A RLS garante
        // que apenas o próprio admin enxerga sua linha (auth.uid() = id),
        // então clientes comuns recebem null e são bloqueados.
        const supabase = getSupabaseBrowserClient()
        let adminProfile: { full_name: string | null } | null = null
        if (supabase) {
          const { data } = await supabase
            .from('admin_profiles')
            .select('full_name')
            .eq('id', s.user.id)
            .maybeSingle()
          adminProfile = data
        }

        if (!active) return

        if (!adminProfile) {
          // Usuário autenticado, mas não é administrador: encerra a sessão.
          await supabase?.auth.signOut()
          if (!active) return
          setUser(null)
          setStatus('unauthenticated')
          return
        }

        const name =
          adminProfile.full_name ??
          (s.user.user_metadata?.name as string) ??
          s.user.email?.split('@')[0] ??
          'Administrador'

        setUser({
          id: s.user.id,
          email: s.user.email ?? '',
          name,
        })
        setStatus('authenticated')
      } else {
        setUser(null)
        setStatus('unauthenticated')
      }
    }

    bootstrap()
    return () => {
      active = false
    }
  }, [usingSupabase])

  const signIn = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      if (usingSupabase) {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) return { error: 'Serviço de autenticação indisponível.' }
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) return { error: 'E-mail ou senha incorretos.' }

        // Garante que somente administradores acessem o painel.
        const userId = data.user?.id
        let isAdmin = false
        if (userId) {
          const { data: profile } = await supabase
            .from('admin_profiles')
            .select('id')
            .eq('id', userId)
            .maybeSingle()
          isAdmin = !!profile
        }
        if (!isAdmin) {
          await supabase.auth.signOut()
          return {
            error: 'Esta conta não tem acesso ao painel administrativo.',
          }
        }
        return {}
      }

      // Modo de demonstração: valida contra as credenciais de teste.
      const emailOk =
        email.trim().toLowerCase() === TEST_CREDENTIALS.email.toLowerCase()
      const passwordOk = password === TEST_CREDENTIALS.password
      if (!emailOk || !passwordOk) {
        return { error: 'E-mail ou senha incorretos.' }
      }
      try {
        window.localStorage.setItem(MOCK_SESSION_KEY, '1')
      } catch {
        // Ignora indisponibilidade do localStorage.
      }
      setUser(MOCK_ADMIN_USER)
      setStatus('authenticated')
      return {}
    },
    [usingSupabase],
  )

  const updateProfile = useCallback(
    async ({
      fullName,
      email,
      password,
    }: UpdateProfileInput): Promise<UpdateProfileResult> => {
      const trimmedName = fullName.trim()
      const trimmedEmail = email.trim()

      if (!trimmedName) return { error: 'Informe o nome completo.' }
      if (!trimmedEmail) return { error: 'Informe o e-mail.' }
      if (password && password.length < 6) {
        return { error: 'A nova senha deve ter ao menos 6 caracteres.' }
      }

      if (!usingSupabase) {
        // Modo de demonstração: apenas reflete na interface.
        setUser((prev) =>
          prev ? { ...prev, name: trimmedName, email: trimmedEmail } : prev,
        )
        return {}
      }

      const supabase = getSupabaseBrowserClient()
      if (!supabase || !user) {
        return { error: 'Sessão indisponível. Faça login novamente.' }
      }

      // Atualiza o perfil administrativo (nome).
      const { error: profileError } = await supabase
        .from('admin_profiles')
        .update({ full_name: trimmedName })
        .eq('id', user.id)
      if (profileError) {
        return { error: 'Não foi possível salvar o nome. Tente novamente.' }
      }

      // Atualiza credenciais de acesso (e-mail/senha) e metadados.
      const authPayload: {
        email?: string
        password?: string
        data?: Record<string, unknown>
      } = { data: { name: trimmedName } }
      if (trimmedEmail && trimmedEmail !== user.email) {
        authPayload.email = trimmedEmail
      }
      if (password) authPayload.password = password

      const { error: authError } = await supabase.auth.updateUser(authPayload)
      if (authError) {
        return {
          error:
            'Nome salvo, mas não foi possível atualizar e-mail/senha. Verifique os dados.',
        }
      }

      // Reflete imediatamente na topbar/menu.
      setUser((prev) =>
        prev ? { ...prev, name: trimmedName, email: trimmedEmail } : prev,
      )
      return {}
    },
    [usingSupabase, user],
  )

  const signOut = useCallback(async () => {
    if (usingSupabase) {
      const supabase = getSupabaseBrowserClient()
      await supabase?.auth.signOut()
    } else {
      try {
        window.localStorage.removeItem(MOCK_SESSION_KEY)
      } catch {
        // Ignora indisponibilidade do localStorage.
      }
    }
    setUser(null)
    setStatus('unauthenticated')
  }, [usingSupabase])

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        status,
        isMock: !usingSupabase,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) {
    throw new Error('useAdminAuth deve ser usado dentro de AdminAuthProvider')
  }
  return ctx
}
