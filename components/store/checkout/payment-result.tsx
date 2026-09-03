import Link from 'next/link'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'

type Status = 'success' | 'pending' | 'failure'

const CONFIG: Record<
  Status,
  {
    icon: typeof CheckCircle2
    title: string
    message: string
    accent: string
    iconWrap: string
  }
> = {
  success: {
    icon: CheckCircle2,
    title: 'Pagamento aprovado!',
    message:
      'Recebemos a confirmação do seu pagamento. Em instantes entraremos em contato pelo WhatsApp para combinar a entrega.',
    accent: 'text-primary',
    iconWrap: 'bg-primary/10 text-primary',
  },
  pending: {
    icon: Clock,
    title: 'Pagamento pendente',
    message:
      'Seu pagamento está em análise pelo Mercado Pago. Assim que for aprovado, você recebe a confirmação. Guarde o número do pedido.',
    accent: 'text-amber-600',
    iconWrap: 'bg-amber-500/10 text-amber-600',
  },
  failure: {
    icon: XCircle,
    title: 'Pagamento não concluído',
    message:
      'Não foi possível concluir o pagamento. Seu pedido foi registrado — você pode tentar pagar novamente ou falar com a gente pelo WhatsApp.',
    accent: 'text-destructive',
    iconWrap: 'bg-destructive/10 text-destructive',
  },
}

export function PaymentResult({
  status,
  orderNumber,
}: {
  status: Status
  orderNumber?: string
}) {
  const cfg = CONFIG[status]
  const Icon = cfg.icon

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 lg:px-8 lg:py-20">
      <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-10">
        <span
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${cfg.iconWrap}`}
        >
          <Icon className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-serif text-3xl font-semibold text-foreground">
          {cfg.title}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-pretty text-sm text-muted-foreground">
          {cfg.message}
        </p>

        {orderNumber ? (
          <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-muted/60 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Número do pedido
              </span>
              <span className="text-sm font-bold text-foreground">
                {orderNumber}
              </span>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/produto"
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Continuar comprando
          </Link>
          {status === 'failure' ? (
            <Link
              href="/checkout"
              className="inline-flex h-12 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Voltar ao checkout
            </Link>
          ) : (
            <Link
              href="/conta"
              className="inline-flex h-12 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Ver meus pedidos
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
