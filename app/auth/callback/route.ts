import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Rota de retorno dos e-mails transacionais (Supabase Auth).
 *
 * Suporta os dois formatos de link:
 *  - Fluxo PKCE:        ?code=...
 *  - Fluxo token hash:  ?token_hash=...&type=signup|recovery|email_change|email
 *
 * O parâmetro `next` define para onde o cliente é levado após a validação:
 *  - Confirmação de cadastro  -> /conta
 *  - Redefinição de senha     -> /conta/atualizar-senha
 *  - Alteração de e-mail      -> /conta
 */

/** Garante que o redirecionamento é interno (evita open redirect). */
function safeNext(raw: string | null): string {
  if (!raw) return '/conta'
  // precisa ser um caminho relativo simples ("/algo"), nunca "//host" ou URL absoluta
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/conta'
  return raw
}

/** Classifica o erro para uma mensagem clara na página de erro. */
function reasonFrom(message?: string | null): string {
  const m = (message ?? '').toLowerCase()
  if (m.includes('expired')) return 'expired'
  if (m.includes('invalid') || m.includes('not found')) return 'invalid'
  return 'unknown'
}

function errorRedirect(
  origin: string,
  message: string | null,
  type: string | null,
) {
  const url = new URL('/auth/error', origin)
  url.searchParams.set('reason', reasonFrom(message))
  if (type) url.searchParams.set('type', type)
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = safeNext(searchParams.get('next'))

  const supabase = await createClient()

  // Fluxo PKCE (?code=)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
    return errorRedirect(origin, error.message, type)
  }

  // Fluxo token hash (?token_hash=&type=)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })
    if (!error) return NextResponse.redirect(`${origin}${next}`)
    return errorRedirect(origin, error.message, type)
  }

  // Sem parâmetros reconhecidos
  return errorRedirect(origin, 'invalid', type)
}
