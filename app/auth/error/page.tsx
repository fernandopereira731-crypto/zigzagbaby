import Link from 'next/link'
import { TopBar } from '@/components/store/top-bar'
import { SiteHeader } from '@/components/store/site-header'
import { SiteFooter } from '@/components/store/site-footer'

type SearchParams = Promise<{ reason?: string; type?: string }>

/** Monta título e mensagem conforme o motivo e o tipo de link. */
function buildContent(reason?: string, type?: string) {
  const acao =
    type === 'recovery'
      ? 'redefinir sua senha'
      : type === 'email_change'
        ? 'alterar seu e-mail'
        : 'confirmar seu cadastro'

  if (reason === 'expired') {
    return {
      title: 'Este link expirou',
      message: `O link para ${acao} tem validade limitada e já não pode mais ser usado. Solicite um novo — leva só alguns segundos.`,
    }
  }
  if (reason === 'invalid') {
    return {
      title: 'Link inválido',
      message: `Não conseguimos validar este link para ${acao}. Ele pode já ter sido utilizado. Solicite um novo para continuar.`,
    }
  }
  return {
    title: 'Não foi possível concluir a autenticação',
    message:
      'Ocorreu um problema ao validar seu acesso. Tente novamente ou volte para a loja.',
  }
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { reason, type } = await searchParams
  const { title, message } = buildContent(reason, type)

  // Para recuperação de senha, o novo link é solicitado na tela de login.
  const primaryHref = '/conta'
  const primaryLabel =
    type === 'recovery' ? 'Solicitar novo link' : 'Ir para minha conta'

  return (
    <>
      <TopBar />
      <SiteHeader />
      <main className="flex min-h-[70vh] flex-col items-center justify-center bg-background px-4 py-16">
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="text-balance font-serif text-2xl font-semibold text-foreground">
            {title}
          </h1>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            {message}
          </p>
          <div className="mt-2 flex w-full flex-col gap-2">
            <Link
              href={primaryHref}
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {primaryLabel}
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Voltar para a loja
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
