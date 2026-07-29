import type { Metadata } from 'next'
import { TopBar } from '@/components/store/top-bar'
import { SiteHeader } from '@/components/store/site-header'
import { SiteFooter } from '@/components/store/site-footer'
import { TrustBand } from '@/components/store/trust-band'
import { RelatedProducts } from '@/components/store/product/related-products'
import { CartClient } from '@/components/store/cart/cart-client'
import { getActiveProducts } from '@/lib/catalog-data'

export const metadata: Metadata = {
  title: 'Meu Carrinho | Zig Zag Baby',
  description:
    'Revise os itens do seu carrinho na Zig Zag Baby. Frete grátis acima de R$199, pagamento no PIX com desconto e entrega no mesmo dia em Curvelo.',
}

export default async function CartPage() {
  const suggestions = await getActiveProducts(4)

  return (
    <>
      <TopBar />
      <SiteHeader />
      <main>
        <CartClient />
        <RelatedProducts products={suggestions} />
        <TrustBand />
      </main>
      <SiteFooter />
    </>
  )
}
