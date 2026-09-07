/**
 * Monta a URL de retorno usada nos e-mails de autenticação do Supabase
 * (confirmação de cadastro, reenvio e redefinição de senha).
 *
 * Regra de ambiente:
 *  - Dentro do preview do v0 (host `*.vusercontent.net`), a origem do sandbox
 *    é efêmera e NÃO pode ser cadastrada no Supabase. Nesse caso usamos o
 *    proxy de redirect estável do v0 (`NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`),
 *    que encaminha para o `/auth/callback` do preview.
 *  - Em qualquer deploy real (domínio `*.vercel.app` ou domínio próprio) usamos
 *    a origem real do site. Usar o proxy do v0 em produção jogaria o usuário
 *    para fora do site (perdendo a sessão de recovery), que é o motivo de o
 *    link "cair na home".
 *
 * `next` é o caminho interno para onde o cliente deve ir depois que o
 * `/auth/callback` validar o link (ex.: `/reset-password`).
 */
export function authRedirectUrl(next: string): string {
  const encodedNext = encodeURIComponent(next)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const host = typeof window !== 'undefined' ? window.location.hostname : ''
  const proxy = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL

  // O proxy só é apropriado no preview interno do v0.
  const isV0Preview = host.endsWith('.vusercontent.net')

  if (isV0Preview && proxy) {
    const sep = proxy.includes('?') ? '&' : '?'
    return `${proxy}${sep}next=${encodedNext}`
  }

  return `${origin}/auth/callback?next=${encodedNext}`
}
