import type { Metadata } from 'next'
import { TopBar } from '@/components/store/top-bar'
import { SiteHeader } from '@/components/store/site-header'
import { SiteFooter } from '@/components/store/site-footer'
import { CheckoutClient } from '@/components/store/checkout/checkout-client'

export const metadata: Metadata = {
  title: 'Finalizar Pedido | Zig Zag Baby',
  description:
    'Finalize seu pedido na Zig Zag Baby com segurança. Entrega no mesmo dia em Curvelo, retirada na loja, pagamento no PIX com desconto e troca fácil.',
}

export default function CheckoutPage() {
  return (
    <>
      <TopBar />
      <SiteHeader />
      <main>
        <CheckoutClient />
      </main>
      <SiteFooter />
    </>
  )
}
