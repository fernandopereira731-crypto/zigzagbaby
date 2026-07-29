import type { Metadata } from 'next'
import { TopBar } from '@/components/store/top-bar'
import { SiteHeader } from '@/components/store/site-header'
import { SiteFooter } from '@/components/store/site-footer'
import { AccountClient } from '@/components/store/account/account-client'

export const metadata: Metadata = {
  title: 'Minha Conta | Zig Zag Baby',
  description:
    'Acompanhe pedidos, favoritos, endereços e trocas na sua conta Zig Zag Baby.',
}

export default function ContaPage() {
  return (
    <>
      <TopBar />
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <AccountClient />
      </main>
      <SiteFooter />
    </>
  )
}
