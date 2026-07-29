'use client'

import Link from 'next/link'
import { ShoppingBag, Zap } from 'lucide-react'
import type { PublicProduct } from '@/lib/catalog-types'
import { WhatsAppIcon } from '../whatsapp-icon'
import { formatBRL } from '@/lib/format'
import { whatsappUrl } from '@/lib/site'
import { useStore } from '../store-context'

export function MobileBuyBar({ product }: { product: PublicProduct }) {
  const { addToCart } = useStore()
  const whatsappHref = whatsappUrl(
    `Olá! Tenho interesse no produto "${product.name}".`,
  )

  const handleBuy = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      image: product.image,
      color: product.colors[0] ?? 'Único',
      size: product.sizes[0] ?? 'Único',
    })
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 py-2.5 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] backdrop-blur-md lg:hidden">
      <div className="flex items-center gap-2">
        <div className="flex flex-col leading-none">
          <span className="text-[11px] text-muted-foreground">no PIX</span>
          <span className="text-lg font-extrabold text-primary">
            {formatBRL(product.pixPrice)}
          </span>
        </div>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Comprar pelo WhatsApp"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground transition-transform active:scale-95"
        >
          <WhatsAppIcon className="h-5 w-5" />
        </a>
        <Link
          href="/carrinho"
          aria-label="Ir para o carrinho"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary text-primary transition-transform active:scale-95"
        >
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        </Link>
        <Link
          href="/carrinho"
          onClick={handleBuy}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground transition-transform active:scale-95"
        >
          <Zap className="h-5 w-5" aria-hidden="true" />
          Comprar agora
        </Link>
      </div>
    </div>
  )
}
