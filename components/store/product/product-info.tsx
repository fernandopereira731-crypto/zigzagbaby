'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Check,
  CreditCard,
  Heart,
  Package,
  RotateCcw,
  Ruler,
  ShoppingBag,
  Star,
  Truck,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/format'
import type { PublicProduct } from '@/lib/catalog-types'
import { WhatsAppIcon } from '../whatsapp-icon'
import { whatsappUrl } from '@/lib/site'
import { useStore } from '../store-context'

// Amostras de cor conhecidas (para exibir o disquinho). Cores fora da lista
// aparecem apenas com o nome — nada é inventado.
const COLOR_SWATCHES: Record<string, string> = {
  rosa: '#f4c2d0',
  azul: '#bcd4ec',
  bege: '#e8dcc6',
  branco: '#f5f1ea',
  verde: '#c6dcc6',
  amarelo: '#f2e2a8',
  cinza: '#d5d5d5',
  vermelho: '#e2a5a5',
  lilas: '#d9cdec',
  laranja: '#f2c7a8',
  preto: '#3a3a3a',
  marrom: '#c8ab8e',
}

function swatch(name: string): string | null {
  const key = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return COLOR_SWATCHES[key] ?? null
}

export function ProductInfo({
  product,
  onOpenSizeGuide,
}: {
  product: PublicProduct
  onOpenSizeGuide?: () => void
}) {
  const { isFavorite, toggleFavorite, addToCart } = useStore()
  const colors = product.colors.length ? product.colors : ['Único']
  const [color, setColor] = useState(colors[0])
  const [size, setSize] = useState<string | null>(null)
  const favorite = isFavorite(product.id)
  const [added, setAdded] = useState(false)

  const whatsappHref = whatsappUrl(
    `Olá! Tenho interesse no produto "${product.name}".`,
  )

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      image: product.image,
      color,
      size: size ?? product.sizes[0] ?? 'Único',
    })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1500)
  }

  const selectedVariant = product.variants.find((v) => v.size === size)
  const lowStock =
    selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 3
  const hasSizes = product.sizes.length > 0

  return (
    <div className="zzb-animate-fade-up flex flex-col">
      {/* Badges */}
      {product.tag && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
            {product.tag.label}
          </span>
        </div>
      )}

      {/* Rating */}
      {product.reviews > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-accent text-accent" />
            ))}
          </div>
          <span className="text-sm font-bold text-foreground">
            {product.rating.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">
            ({product.reviews}{' '}
            {product.reviews === 1 ? 'avaliação' : 'avaliações'})
          </span>
        </div>
      )}

      {/* Name + code */}
      <h1 className="mt-2 text-balance font-serif text-3xl font-semibold text-foreground sm:text-4xl">
        {product.name}
      </h1>
      {product.sku && (
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          Código: {product.sku}
        </p>
      )}

      {/* Prices */}
      <div className="mt-5 rounded-3xl border border-border bg-card p-5">
        {product.oldPrice && (
          <div className="flex items-center gap-3">
            <span className="text-base font-medium text-muted-foreground line-through">
              {formatBRL(product.oldPrice)}
            </span>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">
              Economize {formatBRL(product.oldPrice - product.price)}
            </span>
          </div>
        )}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold text-primary">
            {formatBRL(product.pixPrice)}
          </span>
          <span className="text-sm font-bold text-primary">no PIX</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          ou {formatBRL(product.price)} em até{' '}
          <strong className="text-foreground">3x sem juros</strong>
        </p>
      </div>

      {/* Description */}
      {product.description && (
        <p className="mt-5 text-pretty text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>
      )}

      {/* Color */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">
            Cor:{' '}
            <span className="font-semibold text-muted-foreground">{color}</span>
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2.5">
          {colors.map((c) => {
            const hex = swatch(c)
            const active = c === color
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Cor ${c}`}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm font-semibold transition-all hover:scale-105',
                  active
                    ? 'border-primary text-foreground ring-2 ring-primary/20'
                    : 'border-border text-muted-foreground',
                )}
              >
                {hex && (
                  <span
                    className="h-5 w-5 rounded-full border border-border"
                    style={{ backgroundColor: hex }}
                  />
                )}
                {c}
              </button>
            )
          })}
        </div>
      </div>

      {/* Size */}
      {hasSizes && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Tamanho</span>
            <button
              type="button"
              onClick={onOpenSizeGuide}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-primary underline-offset-4 hover:underline"
            >
              <Ruler className="h-4 w-4" aria-hidden="true" />
              Guia de tamanhos
            </button>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-8">
            {product.variants.map((v) => {
              const out = v.stock === 0
              return (
                <button
                  key={v.size}
                  type="button"
                  disabled={out}
                  onClick={() => setSize(v.size)}
                  aria-pressed={v.size === size}
                  className={cn(
                    'relative flex h-11 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all',
                    out
                      ? 'cursor-not-allowed border-border bg-muted text-muted-foreground/50 line-through'
                      : v.size === size
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-foreground hover:border-primary hover:scale-105',
                  )}
                >
                  {v.size}
                </button>
              )
            })}
          </div>

          {/* Stock hints */}
          {size && !lowStock && selectedVariant && selectedVariant.stock > 0 && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-whatsapp">
              <Check className="h-4 w-4" aria-hidden="true" />
              {selectedVariant.stock} unidades em estoque
            </p>
          )}
          {lowStock && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-secondary-foreground">
              <Zap className="h-4 w-4" aria-hidden="true" />
              Corra! Restam apenas {selectedVariant?.stock} unidades
            </p>
          )}
          {!size && (
            <p className="mt-2 text-sm text-muted-foreground">
              Selecione um tamanho para continuar
            </p>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="mt-6 flex flex-col gap-3">
        <Link
          href="/carrinho"
          onClick={handleAddToCart}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Zap className="h-5 w-5" aria-hidden="true" />
          Comprar agora
        </Link>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            className={cn(
              'inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border-2 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]',
              added
                ? 'border-whatsapp bg-whatsapp/10 text-whatsapp'
                : 'border-primary text-primary hover:bg-primary/5',
            )}
          >
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            {added ? 'Adicionado!' : 'Adicionar ao carrinho'}
          </button>
          <button
            type="button"
            onClick={() => toggleFavorite(product.id)}
            aria-label={
              favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'
            }
            aria-pressed={favorite}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-border text-foreground transition-all hover:scale-105 hover:border-primary active:scale-95"
          >
            <Heart
              className={cn(
                'h-5 w-5 transition-colors',
                favorite && 'fill-secondary text-secondary-foreground',
              )}
              aria-hidden="true"
            />
          </button>
        </div>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-whatsapp text-sm font-bold text-whatsapp-foreground shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <WhatsAppIcon className="h-5 w-5" />
          Comprar pelo WhatsApp
        </a>
      </div>

      {/* Delivery block */}
      <ul className="mt-6 flex flex-col gap-3 rounded-3xl border border-border bg-muted/40 p-5">
        <li className="flex items-start gap-3">
          <Truck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <span className="text-sm text-foreground">
            <strong>Receba hoje em Curvelo</strong> para pedidos confirmados até 16h
          </span>
        </li>
        <li className="flex items-start gap-3">
          <Package className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <span className="text-sm text-foreground">Retirada na loja disponível</span>
        </li>
        <li className="flex items-start gap-3">
          <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <span className="text-sm text-foreground">PIX, cartão e Pix na entrega</span>
        </li>
        <li className="flex items-start gap-3">
          <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <span className="text-sm text-foreground">Troca fácil em até 30 dias</span>
        </li>
      </ul>
    </div>
  )
}
