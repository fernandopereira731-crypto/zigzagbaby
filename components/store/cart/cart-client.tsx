'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Minus,
  Plus,
  Trash2,
  Tag,
  Check,
  Truck,
  ShieldCheck,
  Lock,
  ArrowLeft,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/format'
import { WhatsAppIcon } from '../whatsapp-icon'
import { whatsappUrl } from '@/lib/site'
import { useStore } from '../store-context'
import {
  validateCoupon,
  calcCouponDiscount,
  type Coupon,
} from '@/components/admin/coupons-service'

type DisplayItem = {
  id: string
  name: string
  image: string
  color: string
  size: string
  price: number
  oldPrice?: number
  quantity: number
}

const FREE_SHIPPING_THRESHOLD = 199.9
const SHIPPING_FEE = 19.9
const PIX_DISCOUNT = 0.05

const WHATSAPP_URL = whatsappUrl(
  'Olá! Quero finalizar a compra do meu carrinho.',
)

export function CartClient() {
  const { cartItems, ready, setQuantity, removeFromCart } = useStore()
  const [couponInput, setCouponInput] = useState('')
  const [appliedCouponData, setAppliedCouponData] = useState<Coupon | null>(
    null,
  )
  const [couponError, setCouponError] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const appliedCoupon = appliedCouponData?.code ?? null

  // Deriva os itens exibidos a partir do snapshot guardado no carrinho.
  const items = useMemo<DisplayItem[]>(() => {
    return cartItems.map((entry) => ({
      ...entry.product,
      quantity: entry.quantity,
    }))
  }, [cartItems])

  const updateQuantity = (id: string, delta: number) => {
    const current = cartItems.find((item) => item.product.id === id)
    if (!current) return
    setQuantity(id, Math.max(1, current.quantity + delta))
  }

  const removeItem = (id: string) => {
    removeFromCart(id)
  }

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase()
    if (!code || applyingCoupon) return
    const currentSubtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    )
    setApplyingCoupon(true)
    setCouponError('')
    try {
      const result = await validateCoupon(code, currentSubtotal)
      if (result.valid && result.coupon) {
        setAppliedCouponData(result.coupon)
        setCouponError('')
      } else {
        setAppliedCouponData(null)
        setCouponError(result.message)
      }
    } catch {
      setAppliedCouponData(null)
      setCouponError('Não foi possível validar o cupom. Tente novamente.')
    } finally {
      setApplyingCoupon(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCouponData(null)
    setCouponInput('')
    setCouponError('')
  }

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  )

  const discount =
    appliedCouponData && subtotal >= appliedCouponData.minOrder
      ? calcCouponDiscount(appliedCouponData, subtotal)
      : 0
  const afterDiscount = subtotal - discount
  const shipping =
    items.length === 0 || afterDiscount >= FREE_SHIPPING_THRESHOLD
      ? 0
      : SHIPPING_FEE
  const total = afterDiscount + shipping
  const pixTotal = total * (1 - PIX_DISCOUNT)
  const missingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - afterDiscount,
  )
  const freeShippingProgress = Math.min(
    100,
    (afterDiscount / FREE_SHIPPING_THRESHOLD) * 100,
  )

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div
          className="h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
          role="status"
          aria-label="Carregando carrinho"
        />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center lg:py-24">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-9 w-9" aria-hidden="true" />
        </div>
        <h1 className="mt-6 font-serif text-3xl font-semibold text-foreground">
          Seu carrinho está vazio
        </h1>
        <p className="mt-2 text-muted-foreground">
          Que tal escolher algumas peças cheias de carinho para os pequenos?
        </p>
        <Link
          href="/#produtos"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Explorar produtos
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-8 lg:px-8 lg:pb-12 lg:pt-12">
      <div className="flex flex-col gap-1">
        <Link
          href="/#produtos"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Continuar comprando
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
          Meu carrinho
        </h1>
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? 'item' : 'itens'} no seu carrinho
        </p>
      </div>

      {/* Free shipping progress */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Truck className="h-4 w-4 text-primary" aria-hidden="true" />
          {missingForFreeShipping > 0 ? (
            <span>
              Faltam{' '}
              <span className="text-primary">
                {formatBRL(missingForFreeShipping)}
              </span>{' '}
              para o frete grátis!
            </span>
          ) : (
            <span className="text-primary">
              Você ganhou frete grátis nesta compra!
            </span>
          )}
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Items list */}
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex gap-4 rounded-3xl border border-border bg-card p-3 shadow-sm sm:p-4"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-28 sm:w-28">
                <Image
                  src={item.image || '/placeholder.svg'}
                  alt={item.name}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-foreground sm:text-base">
                      {item.name}
                    </h2>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-muted px-2 py-0.5">
                        Cor: {item.color}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5">
                        Tam: {item.size}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remover ${item.name} do carrinho`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-secondary-foreground"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                  {/* Quantity stepper */}
                  <div className="inline-flex items-center rounded-full border border-border">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      disabled={item.quantity <= 1}
                      aria-label="Diminuir quantidade"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      aria-label="Aumentar quantidade"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="text-right">
                    {item.oldPrice && (
                      <span className="block text-xs font-medium text-muted-foreground line-through">
                        {formatBRL(item.oldPrice * item.quantity)}
                      </span>
                    )}
                    <span className="text-lg font-extrabold text-foreground">
                      {formatBRL(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Order summary */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Resumo do pedido
            </h2>

            {/* Coupon */}
            <div className="mt-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-2xl bg-primary/10 px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Cupom {appliedCoupon} aplicado
                  </span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="coupon"
                    className="text-sm font-semibold text-foreground"
                  >
                    Cupom de desconto
                  </label>
                  <div className="mt-2 flex gap-2">
                    <div className="relative flex-1">
                      <Tag
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <input
                        id="coupon"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                            applyCoupon()
                          }
                        }}
                        placeholder="Digite seu cupom"
                        className="h-11 w-full rounded-full border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={applyCoupon}
                      className="shrink-0 rounded-full bg-foreground px-5 text-sm font-bold text-background transition-transform active:scale-95"
                    >
                      Aplicar
                    </button>
                  </div>
                  {couponError && (
                    <p className="mt-2 text-xs font-medium text-secondary-foreground">
                      {couponError}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Experimente: ZIGZAG10 ou BEMVINDO
                  </p>
                </div>
              )}
            </div>

            <hr className="my-4 border-border" />

            {/* Totals */}
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-semibold text-foreground">
                  {formatBRL(subtotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Desconto</dt>
                <dd
                  className={cn(
                    'font-semibold',
                    discount > 0 ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {discount > 0 ? `- ${formatBRL(discount)}` : formatBRL(0)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Entrega</dt>
                <dd className="font-semibold text-foreground">
                  {shipping === 0 ? (
                    <span className="text-primary">Grátis</span>
                  ) : (
                    formatBRL(shipping)
                  )}
                </dd>
              </div>
            </dl>

            <hr className="my-4 border-border" />

            <div className="flex items-end justify-between">
              <span className="text-sm font-semibold text-foreground">
                Total
              </span>
              <span className="text-2xl font-extrabold text-foreground">
                {formatBRL(total)}
              </span>
            </div>

            {/* PIX highlight */}
            <div className="mt-3 rounded-2xl bg-primary/10 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-primary">
                  À vista no PIX
                </span>
                <span className="text-xl font-extrabold text-primary">
                  {formatBRL(pixTotal)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Economize {formatBRL(total - pixTotal)} pagando com PIX (5% off)
              </p>
            </div>

            {/* Actions */}
            <div className="mt-5 flex flex-col gap-3">
              <Link
                href="/checkout"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Zap className="h-5 w-5" aria-hidden="true" />
                Finalizar compra
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-whatsapp text-sm font-bold text-whatsapp-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Comprar pelo WhatsApp
              </a>
            </div>

            {/* Mini trust */}
            <ul className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: Lock, label: 'Compra segura' },
                { icon: Truck, label: 'Entrega rápida' },
                { icon: ShieldCheck, label: 'Troca fácil' },
              ].map((t) => (
                <li
                  key={t.label}
                  className="flex flex-col items-center gap-1.5 rounded-2xl bg-muted/60 px-2 py-3"
                >
                  <t.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span className="text-[11px] font-semibold text-foreground">
                    {t.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Mobile fixed checkout bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 py-2.5 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex flex-col leading-none">
            <span className="text-[11px] text-muted-foreground">
              Total no PIX
            </span>
            <span className="text-lg font-extrabold text-primary">
              {formatBRL(pixTotal)}
            </span>
          </div>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Comprar pelo WhatsApp"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground transition-transform active:scale-95"
          >
            <WhatsAppIcon className="h-5 w-5" />
          </a>
          <Link
            href="/checkout"
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground transition-transform active:scale-95"
          >
            <Zap className="h-5 w-5" aria-hidden="true" />
            Finalizar compra
          </Link>
        </div>
      </div>
    </div>
  )
}
