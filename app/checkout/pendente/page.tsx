import type { Metadata } from 'next'
import { TopBar } from '@/components/store/top-bar'
import { SiteHeader } from '@/components/store/site-header'
import { SiteFooter } from '@/components/store/site-footer'
import { PaymentResult } from '@/components/store/checkout/payment-result'

export const metadata: Metadata = {
  title: 'Pagamento pendente | Zig Zag Baby',
  robots: { index: false, follow: false },
}

export default async function CheckoutPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ pedido?: string }>
}) {
  const { pedido } = await searchParams
  return (
    <>
      <TopBar />
      <SiteHeader />
      <main>
        <PaymentResult status="pending" orderNumber={pedido} />
      </main>
      <SiteFooter />
    </>
  )
}
