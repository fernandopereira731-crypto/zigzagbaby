import { whatsappUrl } from '@/lib/site'

export type OrderStatus =
  | 'entregue'
  | 'a-caminho'
  | 'preparando'
  | 'cancelado'

export type Order = {
  id: string
  date: string
  status: OrderStatus
  total: number
  items: {
    name: string
    image: string
    size: string
    color: string
    qty: number
    price: number
  }[]
  tracking: {
    step: string
    date: string
    done: boolean
  }[]
}

export const statusLabels: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  entregue: {
    label: 'Entregue',
    className: 'bg-whatsapp/15 text-whatsapp',
  },
  'a-caminho': {
    label: 'A caminho',
    className: 'bg-primary/15 text-primary',
  },
  preparando: {
    label: 'Preparando',
    className: 'bg-accent/20 text-accent-foreground',
  },
  cancelado: {
    label: 'Cancelado',
    className: 'bg-secondary text-secondary-foreground',
  },
}

export const WHATSAPP_URL = whatsappUrl(
  'Olá! Preciso de ajuda com minha conta na Zig Zag Baby',
)
