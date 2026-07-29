import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { isSupabaseConfigured } from './config'

let cached: SupabaseClient | null = null

/**
 * Retorna um cliente Supabase para o navegador, ou null quando o Supabase
 * ainda não está conectado (modo de demonstração).
 *
 * O cliente só é criado quando as variáveis de ambiente existem, portanto
 * este arquivo é seguro mesmo sem a integração conectada.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  if (cached) return cached

  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  )
  return cached
}
