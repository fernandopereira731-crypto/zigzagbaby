import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Client Supabase com service role para uso EXCLUSIVO no servidor em
 * contextos sem sessão de usuário (ex.: webhooks server-to-server).
 *
 * A service role key ignora RLS, então este módulo importa `server-only`
 * para garantir, em tempo de build, que ele jamais vá para o cliente.
 *
 * Usado pelo webhook do Mercado Pago para atualizar o status de um pedido
 * após a confirmação do pagamento. NÃO é usado no fluxo de checkout.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('SUPABASE_URL não configurado no ambiente do servidor.')
  }
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY não configurado no ambiente do servidor.',
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
