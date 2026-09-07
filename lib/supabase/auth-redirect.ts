const OFFICIAL_SITE_URL = 'https://www.zigzagbabycurvelo.com.br'

/**
 * Monta a URL de retorno usada nos e-mails de autenticação do Supabase
 * (confirmação de cadastro, reenvio e redefinição de senha).
 *
 * IMPORTANTE — correspondência exata com a allow-list do Supabase:
 * o Supabase compara a URL de retorno com a lista de "Redirect URLs"
 * cadastrada. Se não houver correspondência EXATA (inclusive query string),
 * ele descarta o destino e cai no "Site URL" (a home). Por isso, em produção,
 * o `next` é mantido com a barra LITERAL (`/reset-password`), idêntico ao que
 * está cadastrado: `https://www.zigzagbabycurvelo.com.br/auth/callback?next=/reset-password`.
 * NÃO use encodeURIComponent aqui em produção, senão vira `%2Freset-password`
 * e a correspondência falha.
 *
 * Regra de ambiente:
 *  - Preview interno do v0 (`*.vusercontent.net`): usa o proxy de redirect
 *    estável do v0 (allow-list com wildcard `.../redirect/**`).
 *  - Desenvolvimento local (`localhost`): usa a origem local.
 *  - Produção: SEMPRE o domínio oficial, com o `next` literal.
 *
 * `next` é o caminho interno para onde o cliente vai depois que o
 * `/auth/callback` validar o link (ex.: `/reset-password`).
 */
export function authRedirectUrl(next: string): string {
  const host = typeof window !== 'undefined' ? window.location.hostname : ''
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const proxy = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL

  // Preview interno do v0 (allow-list com wildcard -> encoding é seguro).
  if (host.endsWith('.vusercontent.net') && proxy) {
    const sep = proxy.includes('?') ? '&' : '?'
    return `${proxy}${sep}next=${encodeURIComponent(next)}`
  }

  // Desenvolvimento local (barra literal para casar com o callback).
  if (host === 'localhost' || host === '127.0.0.1') {
    return `${origin}/auth/callback?next=${next}`
  }

  // Produção: domínio oficial + `next` literal, idêntico à Redirect URL
  // cadastrada no Supabase (correspondência exata).
  const base = (process.env.NEXT_PUBLIC_SITE_URL || OFFICIAL_SITE_URL).replace(
    /\/$/,
    '',
  )
  return `${base}/auth/callback?next=${next}`
}
