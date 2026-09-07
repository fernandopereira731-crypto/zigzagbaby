const OFFICIAL_SITE_URL = 'https://www.zigzagbabycurvelo.com.br'

/**
 * Monta a URL de retorno usada nos e-mails de autenticação do Supabase
 * (confirmação de cadastro, reenvio e redefinição de senha).
 *
 * Regra de ambiente:
 *  - Preview interno do v0 (host `*.vusercontent.net`): a origem do sandbox é
 *    efêmera e não pode ser cadastrada no Supabase, então usamos o proxy de
 *    redirect estável do v0 (`NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`), que
 *    encaminha para o `/auth/callback` do preview.
 *  - Desenvolvimento local (`localhost`): usa a origem local.
 *  - Produção: SEMPRE o domínio oficial (`NEXT_PUBLIC_SITE_URL` ou o fallback
 *    `https://www.zigzagbabycurvelo.com.br`). Nunca dependemos de
 *    `window.location.origin` em produção para não vazar o domínio antigo da
 *    Vercel nem quebrar o fluxo quando acessado por um domínio alternativo.
 *
 * `next` é o caminho interno para onde o cliente vai depois que o
 * `/auth/callback` validar o link (ex.: `/reset-password`).
 */
export function authRedirectUrl(next: string): string {
  const encodedNext = encodeURIComponent(next)
  const host = typeof window !== 'undefined' ? window.location.hostname : ''
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const proxy = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL

  // Preview interno do v0.
  if (host.endsWith('.vusercontent.net') && proxy) {
    const sep = proxy.includes('?') ? '&' : '?'
    return `${proxy}${sep}next=${encodedNext}`
  }

  // Desenvolvimento local.
  if (host === 'localhost' || host === '127.0.0.1') {
    return `${origin}/auth/callback?next=${encodedNext}`
  }

  // Produção: domínio oficial, independente de como o site foi acessado.
  const base = (process.env.NEXT_PUBLIC_SITE_URL || OFFICIAL_SITE_URL).replace(
    /\/$/,
    '',
  )
  return `${base}/auth/callback?next=${encodedNext}`
}
