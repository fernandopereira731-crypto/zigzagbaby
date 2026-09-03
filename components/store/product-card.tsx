'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { Check, Heart, Minus, Plus, ShoppingBag, Star, X, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/format'
import type { PublicProduct } from '@/lib/catalog-types'
import { useStore } from './store-context'

// Etapas do modal de compra rápida a partir da vitrine:
// - 'buy': escolher tamanho/quantidade antes de adicionar ao carrinho;
// - 'added': confirmação com "continuar comprando" / "finalizar compra".
type ModalStep = null | 'buy' | 'added'

export function ProductCard({ product }: { product: PublicProduct }) {
  const { isFavorite, toggleFavorite, addToCart } = useStore()
  const favorite = isFavorite(product.id)
  const href = `/produto/${product.slug}`

  const colors = product.colors.length
    ? product.colors
    : product.color
      ? [product.color]
      : ['Único']

  const [step, setStep] = useState<ModalStep>(null)
  const [color, setColor] = useState(colors[0])
  const [size, setSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const canSelectSize = product.variants.length > 0
  const selectedVariant = product.variants.find((v) => v.size === size)
  const maxQty = canSelectSize
    ? (selectedVariant?.stock ?? 0)
    : product.stock > 0
      ? product.stock
      : 99
  const lowStock =
    selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 3
  // Só permite adicionar quando há tamanho escolhido (quando há tamanhos).
  const canAdd = canSelectSize
    ? !!selectedVariant && selectedVariant.stock > 0
    : true

  // Abre o modal de compra rápida (não adiciona nada ainda).
  const openBuy = () => {
    setSize(null)
    setQuantity(1)
    setColor(colors[0])
    setStep('buy')
  }

  const handleAddToCart = () => {
    if (!canAdd) return
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        oldPrice: product.oldPrice,
        image: product.image,
        color,
        size: size ?? product.sizes[0] ?? 'Único',
      },
      quantity,
    )
    setStep('added')
  }

  // Trava o scroll do body e fecha com ESC enquanto o modal está aberto.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setStep(null)
    }
    if (step) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [step])

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
            onClick={openBuy}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:scale-[1.02] hover:brightness-105 active:scale-[0.98]"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            Comprar
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

      {/* Modais renderizados via portal no body para escapar de ancestrais com
          transform e nunca ficarem presos/cortados dentro do card. */}
      {mounted &&
        step &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pc-modal-title"
            className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-foreground/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setStep(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="zzb-animate-fade-up flex max-h-[100dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl"
            >
              {step === 'buy' ? (
                <>
                  {/* Conteúdo rolável */}
                  <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h2
                        id="pc-modal-title"
                        className="text-balance font-serif text-lg font-semibold text-foreground"
                      >
                        Escolha as opções
                      </h2>
                      <button
                        type="button"
                        onClick={() => setStep(null)}
                        aria-label="Fechar"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Produto: foto, nome, preço */}
                    <div className="mt-4 flex gap-4">
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted">
                        <Image
                          src={product.image || '/placeholder.svg'}
                          alt={product.name}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-foreground">
                          {product.name}
                        </h3>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span className="text-xl font-extrabold text-primary">
                            {formatBRL(product.pixPrice)}
                          </span>
                          <span className="text-xs font-bold text-primary">
                            no PIX
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ou {formatBRL(product.price)} em até 3x sem juros
                        </p>
                      </div>
                    </div>

                    {/* Cores (apenas quando houver mais de uma) */}
                    {colors.length > 1 && (
                      <div className="mt-5">
                        <span className="text-sm font-bold text-foreground">
                          Cor:{' '}
                          <span className="font-semibold text-muted-foreground">
                            {color}
                          </span>
                        </span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {colors.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setColor(c)}
                              aria-pressed={c === color}
                              className={cn(
                                'rounded-full border-2 px-3 py-1.5 text-sm font-semibold transition-all hover:scale-105',
                                c === color
                                  ? 'border-primary text-foreground ring-2 ring-primary/20'
                                  : 'border-border text-muted-foreground',
                              )}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tamanhos disponíveis em estoque */}
                    {canSelectSize && (
                      <div className="mt-5">
                        <span className="text-sm font-bold text-foreground">
                          Tamanho
                        </span>
                        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
                          {product.variants.map((v) => {
                            const out = v.stock === 0
                            return (
                              <button
                                key={v.size}
                                type="button"
                                disabled={out}
                                onClick={() => {
                                  setSize(v.size)
                                  setQuantity(1)
                                }}
                                aria-pressed={v.size === size}
                                className={cn(
                                  'flex h-11 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all',
                                  out
                                    ? 'cursor-not-allowed border-border bg-muted text-muted-foreground/50 line-through'
                                    : v.size === size
                                      ? 'border-primary bg-primary text-primary-foreground'
                                      : 'border-border text-foreground hover:scale-105 hover:border-primary',
                                )}
                              >
                                {v.size}
                              </button>
                            )
                          })}
                        </div>
                        {!size && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            Selecione um tamanho para continuar
                          </p>
                        )}
                        {size && lowStock && (
                          <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-secondary-foreground">
                            <Zap className="h-4 w-4" aria-hidden="true" />
                            Corra! Restam apenas {selectedVariant?.stock} unidades
                          </p>
                        )}
                        {size && !lowStock && selectedVariant && (
                          <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-whatsapp">
                            <Check className="h-4 w-4" aria-hidden="true" />
                            {selectedVariant.stock} unidades em estoque
                          </p>
                        )}
                      </div>
                    )}

                    {/* Quantidade limitada ao estoque */}
                    <div className="mt-5">
                      <span className="text-sm font-bold text-foreground">
                        Quantidade
                      </span>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="inline-flex items-center rounded-full border-2 border-border">
                          <button
                            type="button"
                            aria-label="Diminuir quantidade"
                            disabled={quantity <= 1}
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                          >
                            <Minus className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <span className="w-10 text-center text-sm font-bold text-foreground">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Aumentar quantidade"
                            disabled={(canSelectSize && !size) || quantity >= maxQty}
                            onClick={() =>
                              setQuantity((q) => Math.min(maxQty, q + 1))
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                          >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                        {canSelectSize && size && (
                          <span className="text-xs text-muted-foreground">
                            máx. {maxQty}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rodapé fixo: ação principal sempre visível */}
                  <div className="shrink-0 border-t border-border bg-card p-5 sm:p-6">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={!canAdd}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                    >
                      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                      {canSelectSize && !size
                        ? 'Escolha um tamanho'
                        : 'Adicionar ao carrinho'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Confirmação pós-adição */}
                  <div className="min-h-0 flex-1 overflow-y-auto p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-whatsapp/10 text-whatsapp">
                          <Check className="h-6 w-6" aria-hidden="true" />
                        </span>
                        <h2
                          id="pc-modal-title"
                          className="text-balance font-serif text-lg font-semibold text-foreground"
                        >
                          Produto adicionado ao carrinho
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(null)}
                        aria-label="Fechar"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      O que você deseja fazer agora?
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 border-t border-border bg-card p-6">
                    <Link
                      href="/carrinho"
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Zap className="h-5 w-5" aria-hidden="true" />
                      Finalizar compra
                    </Link>
                    <button
                      type="button"
                      onClick={() => setStep(null)}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-primary text-sm font-bold text-primary transition-all hover:scale-[1.02] hover:bg-primary/5 active:scale-[0.98]"
                    >
                      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                      Continuar comprando
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </article>
  )
}
