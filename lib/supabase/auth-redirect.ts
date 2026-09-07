/**
 * Monta a URL de retorno usada nos e-mails de autenticação do Supabase
 * (confirmação de cadastro, reenvio e redefinição de senha).
 *
 * - Em preview (v0), usa o proxy de redirect do v0
 *   (`NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`), que é estável e pode ser
 *   liberado na lista de "Redirect URLs" do Supabase. A origem do sandbox é
 *   efêmera e, se usada direto, o Supabase recusa o link ("link inválido").
 * - Em produção, usa a origem real do site (o domínio publicado).
 *
 * `next` é o caminho interno para onde o cliente deve ir depois que o
 * `/auth/callback` validar o link (ex.: `/conta/atualizar-senha`).
 */
export function authRedirectUrl(next: string): string {
  const encodedNext = encodeURIComponent(next)
  const proxy = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL

  if (proxy) {
    const sep = proxy.includes('?') ? '&' : '?'
    return `${proxy}${sep}next=${encodedNext}`
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/auth/callback?next=${encodedNext}`
}
