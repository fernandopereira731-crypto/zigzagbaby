export type AdminUser = {
  id: string
  email: string
  name: string
}

/**
 * Credenciais temporárias usadas SOMENTE no modo de demonstração
 * (enquanto o Supabase não estiver conectado).
 *
 * Assim que o Supabase for conectado, estas credenciais são ignoradas
 * automaticamente e o login passa a usar a autenticação real.
 */
export const TEST_CREDENTIALS = {
  email: 'admin@zigzagbaby.com.br',
  password: 'zigzag2024',
}

/** Usuário simulado retornado após login no modo de demonstração. */
export const MOCK_ADMIN_USER: AdminUser = {
  id: 'mock-admin',
  email: TEST_CREDENTIALS.email,
  name: 'Fernando',
}

export const MOCK_SESSION_KEY = 'zzb-admin-session'

/**
 * Detecta se o Supabase está conectado ao projeto.
 *
 * O painel usa isto para alternar automaticamente entre:
 * - modo de demonstração (credenciais de teste), quando NÃO configurado;
 * - autenticação real via Supabase, quando configurado.
 *
 * As variáveis são injetadas automaticamente ao conectar a integração
 * do Supabase na v0, sem necessidade de alterar o restante do painel.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}
