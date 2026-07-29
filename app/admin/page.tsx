import type { Metadata } from 'next'
import { AdminApp } from '@/components/admin/admin-app'

export const metadata: Metadata = {
  title: 'Painel Administrativo | Zig Zag Baby',
  description: 'Gerencie produtos, pedidos, clientes e relatórios da Zig Zag Baby.',
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return <AdminApp />
}
