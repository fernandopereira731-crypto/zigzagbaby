import type { Metadata } from 'next'
import { TopBar } from '@/components/store/top-bar'
import { SiteHeader } from '@/components/store/site-header'
import { SiteFooter } from '@/components/store/site-footer'
import { UpdatePasswordForm } from '@/components/store/account/update-password-form'

export const metadata: Metadata = {
  title: 'Atualizar senha | Zig Zag Baby',
  description: 'Crie uma nova senha para acessar sua conta Zig Zag Baby.',
}

export default function AtualizarSenhaPage() {
  return (
    <>
      <TopBar />
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <UpdatePasswordForm />
      </main>
      <SiteFooter />
    </>
  )
}
