'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingBag, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/format'
import type { PublicProduct } from '@/lib/catalog-types'
import { useStore } from './store-context'

export function ProductCard({ product }: { product: PublicProduct }) {
  const { isFavorite, toggleFavorite, addToCart } = useStore()
  const favorite = isFavorite(product.id)
  const [added, setAdded] = useState(false)
  const href = `/produto/${product.slug}`

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      image: product.image,
      color: product.color ?? 'Único',
      size: product.sizes[0] ?? 'Único',
    })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1500)
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(80,120,160,0.55)]">
      <Link
        href={href}
        aria-label={product.name}
        className="relative aspect-square overflow-hidden bg-muted"
      >
        <Image
          src={product.image || '/placeholder.svg'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          loading="lazy"
          className="object-cover transition-opacity duration-500 group-hover:opacity-0"
        />
        <Image
          src={product.image2 || '/placeholder.svg'}
          alt={`${product.name} - outra vista`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          loading="lazy"
          className="scale-105 object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />
        {product.tag && (
          <span
            className={cn(
              'absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-bold shadow-sm',
              product.tag.tone === 'sale'
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-accent text-accent-foreground',
            )}
          >
            {product.tag.label}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            toggleFavorite(product.id)
          }}
          aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          aria-pressed={favorite}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 text-foreground shadow-sm backdrop-blur transition-transform hover:scale-110 active:scale-95"
        >
          <Heart
            className={cn(
              'h-5 w-5 transition-colors',
              favorite && 'fill-secondary text-secondary-foreground',
            )}
            aria-hidden="true"
          />
        </button>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {product.reviews > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((s) => (
                <Star key={s} className="h-3.5 w-3.5 fill-accent text-accent" />
              ))}
            </div>
            <span className="text-xs font-bold text-foreground">
              {product.rating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({product.reviews})
            </span>
          </div>
        )}

        <h3 className="mt-2 text-sm font-bold text-foreground">
          <Link
            href={href}
            className="outline-none transition-colors hover:text-primary focus-visible:text-primary focus-visible:underline"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          Tamanhos: {product.sizesLabel}
        </p>

        <div className="mt-3">
          <div className="flex items-center gap-2">
            {product.oldPrice && (
              <span className="text-sm font-medium text-muted-foreground line-through">
                {formatBRL(product.oldPrice)}
              </span>
            )}
            {product.oldPrice && (
              <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-bold text-secondary-foreground">
                Economize {formatBRL(product.oldPrice - product.price)}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-primary">
              {formatBRL(product.pixPrice)}
            </span>
            <span className="text-xs font-bold text-primary">no PIX</span>
          </div>
          <p className="text-xs text-muted-foreground">
            ou {formatBRL(product.price)} em até 3x sem juros
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]',
              added
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-primary text-primary-foreground hover:brightness-105',
            )}
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            {added ? 'Adicionado!' : 'Comprar'}
          </button>
          <button
            type="button"
            onClick={() => toggleFavorite(product.id)}
            aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            aria-pressed={favorite}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-all hover:scale-105 hover:border-primary active:scale-95"
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-colors',
                favorite && 'fill-secondary text-secondary-foreground',
              )}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </article>
  )
}
