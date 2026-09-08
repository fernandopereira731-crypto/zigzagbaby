'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  MapPin,
  Truck,
  Store,
  CalendarClock,
  CreditCard,
  Banknote,
  Wallet,
  MessageSquare,
  Check,
  Lock,
  ShieldCheck,
  RefreshCw,
  ChevronDown,
  Zap,
  Loader2,
  ShoppingBag,
  PartyPopper,
  AlertCircle,
  Tag,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/format'
import { WhatsAppIcon } from '../whatsapp-icon'
import { whatsappUrl } from '@/lib/site'
import { useStore } from '../store-context'
import { createOrder, type CreateOrderResult } from './checkout-service'
import {
  validateCoupon,
  calcCouponDiscount,
  type Coupon,
} from '@/components/admin/coupons-service'
import { fetchProfile, fetchAddresses } from '../account/account-service'

type Prefill = {
  name: string
  email: string
  phone: string
  cpf: string
  cep: string
  street: string
  number: string
  complement: string
  district: string
  city: string
  state: string
}

const deliveryOptions = [
  {
    id: 'today',
    icon: Truck,
    title: 'Receber hoje em Curvelo',
    desc: 'Pedidos até 16h chegam ainda hoje',
    price: 0,
    badge: 'Grátis',
  },
  {
    id: 'pickup',
    icon: Store,
    title: 'Retirar na loja',
    desc: 'Combine a retirada pelo WhatsApp',
    price: 0,
    badge: 'Grátis',
  },
  {
    id: 'scheduled',
    icon: CalendarClock,
    title: 'Entrega agendada',
    desc: 'Escolha o melhor dia para receber',
    price: 0,
    badge: 'Grátis',
  },
] as const

const paymentOptions = [
  {
    id: 'mercadopago',
    icon: Wallet,
    title: 'Cartão/PIX via Mercado Pago',
    desc: 'Pagamento online seguro pelo Checkout Pro',
  },
  {
    id: 'card',
    icon: CreditCard,
    title: 'Cartão de crédito',
    desc: 'Em até 6x sem juros',
  },
  {
    id: 'cash',
    icon: Banknote,
    title: 'Dinheiro na entrega',
    desc: 'Pague ao receber o pedido',
  },
] as const

const WHATSAPP_URL = whatsappUrl(
  'Olá! Quero finalizar meu pedido na Zig Zag Baby.',
)

type FieldProps = {
  id: string
  label: string
  placeholder?: string
  type?: string
  className?: string
  required?: boolean
  inputMode?: 'text' | 'tel' | 'email' | 'numeric'
  defaultValue?: string
}

function Field({
  id,
  label,
  placeholder,
  type = 'text',
  className,
  required,
  inputMode,
  defaultValue,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="text-secondary-foreground"> *</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  )
}

function SectionCard({
  step,
  icon: Icon,
  title,
  children,
}: {
  step: number
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="font-serif text-xl font-semibold text-foreground">
          <span className="text-primary">{step}.</span> {title}
        </h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function CheckoutClient() {
  const { cartItems, cartCount, removeFromCart, ready } = useStore()

  const [delivery, setDelivery] = useState<string>('today')
  const [payment, setPayment] = useState<string>('mercadopago')
  const [summaryOpen, setSummaryOpen] = useState(false)

  // Cupom: começa sempre vazio. Nenhum desconto é aplicado sem o cliente
  // digitar o código e clicar em "Aplicar".
  const [couponInput, setCouponInput] = useState('')
  const [appliedCouponData, setAppliedCouponData] = useState<Coupon | null>(null)
  const [couponError, setCouponError] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState<CreateOrderResult | null>(null)
  const [prefill, setPrefill] = useState<Prefill | null>(null)

  // Pré-preenche os dados quando a cliente está logada (perfil + endereço padrão).
  useEffect(() => {
    let active = true
    async function loadPrefill() {
      try {
        const profile = await fetchProfile()
        if (!profile) return
        let addr: Awaited<ReturnType<typeof fetchAddresses>>[number] | undefined
        try {
          const addresses = await fetchAddresses()
          addr = addresses.find((a) => a.isDefault) ?? addresses[0]
        } catch {
          addr = undefined
        }
        if (!active) return
        setPrefill({
          name: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          cpf: profile.cpf,
          cep: addr?.zipCode ?? '',
          street: addr?.street ?? '',
          number: addr?.number ?? '',
          complement: addr?.complement ?? '',
          district: addr?.neighborhood ?? '',
          city: addr?.city ?? '',
          state: addr?.state ?? '',
        })
      } catch {
        // Visitante ou erro silencioso: mantém o formulário vazio.
      }
    }
    loadPrefill()
    return () => {
      active = false
    }
  }, [])

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      ),
    [cartItems],
  )

  const appliedCoupon = appliedCouponData?.code ?? null
  const discount =
    appliedCouponData && subtotal >= appliedCouponData.minOrder
      ? calcCouponDiscount(appliedCouponData, subtotal)
      : 0
  const deliveryFee = deliveryOptions.find((o) => o.id === delivery)?.price ?? 0
  const total = subtotal - discount + deliveryFee
  const finalTotal = total

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase()
    if (!code || applyingCoupon) return
    setApplyingCoupon(true)
    setCouponError('')
    try {
      const result = await validateCoupon(code, subtotal)
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setError(null)

    const form = event.currentTarget
    const data = new FormData(form)
    const value = (key: string) => (data.get(key)?.toString() ?? '').trim()

    if (cartItems.length === 0) {
      setError('Seu carrinho está vazio.')
      return
    }

    const customer = {
      name: value('name'),
      email: value('email'),
      phone: value('phone'),
      cpf: value('cpf'),
    }

    if (!customer.name || !customer.phone || !customer.email) {
      setError('Preencha seu nome, telefone e e-mail para continuar.')
      return
    }

    const needsAddress = delivery !== 'pickup'
    const address = needsAddress
      ? {
          cep: value('cep'),
          street: value('street'),
          number: value('number'),
          complement: value('complement'),
          district: value('district'),
          city: value('city'),
          state: value('state'),
        }
      : null

    if (
      needsAddress &&
      address &&
      (!address.cep ||
        !address.street ||
        !address.number ||
        !address.district ||
        !address.city ||
        !address.state)
    ) {
      setError('Preencha o endereço de entrega completo.')
      return
    }

    setSubmitting(true)
    try {
      const result = await createOrder({
        customer,
        address,
        items: cartItems.map((item) => ({
          product_id: item.product.id,
          size: item.product.size,
          color: item.product.color,
          quantity: item.quantity,
        })),
        paymentMethod: payment,
        deliveryMethod: delivery,
        giftWrap: false,
        notes: value('notes') || undefined,
        couponCode: appliedCoupon ?? undefined,
      })

      // Itens reais do carrinho para exibição no Checkout Pro (montados antes
      // de limpar o carrinho). O valor cobrado é reconciliado no servidor com
      // o total autoritativo do pedido.
      const mpItems = cartItems.map((item) => ({
        title: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
      }))

      // Limpa o carrinho após o pedido ser gravado com sucesso.
      cartItems.forEach((item) => removeFromCart(item.product.id))

      // Pagamento online via Mercado Pago Checkout Pro: gera a preferência no
      // servidor e redireciona. As demais formas mantêm o fluxo atual.
      if (payment === 'mercadopago') {
        const response = await fetch('/api/checkout/mercadopago', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: result.id,
            orderNumber: result.order_number,
            total: result.total,
            discount: result.discount,
            shipping: result.shipping,
            giftFee: result.gift_fee,
            items: mpItems,
            payer: {
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
            },
          }),
        })

        const payload = await response.json().catch(() => null)
        if (response.ok && payload?.init_point) {
          window.location.href = payload.init_point as string
          return
        }

        // Falha ao iniciar o pagamento: o pedido já existe, então mostramos a
        // confirmação (evita pedido duplicado) com um aviso.
        setConfirmed(result)
        setError(
          'Seu pedido foi registrado, mas não conseguimos abrir o pagamento online. Entraremos em contato pelo WhatsApp para concluir.',
        )
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      setConfirmed(result)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível concluir o pedido. Tente novamente.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  // 1) Pedido confirmado
  if (confirmed) {
    const orderWhatsApp = whatsappUrl(
      `Olá! Acabei de fazer o pedido ${confirmed.order_number} na Zig Zag Baby (total ${formatBRL(
        confirmed.total,
      )}). Gostaria de combinar o pagamento e a entrega.`,
    )
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 lg:px-8 lg:py-20">
        <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PartyPopper className="h-8 w-8" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-serif text-3xl font-semibold text-foreground">
            Pedido confirmado!
          </h1>
          <p className="mx-auto mt-2 max-w-md text-pretty text-sm text-muted-foreground">
            Recebemos seu pedido com muito carinho. Em instantes entraremos em
            contato pelo WhatsApp para combinar o pagamento e a entrega.
          </p>

          <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-muted/60 p-5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Número do pedido
              </span>
              <span className="text-sm font-bold text-foreground">
                {confirmed.order_number}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Itens</span>
              <span className="text-sm font-bold text-foreground">
                {confirmed.items_count}
              </span>
            </div>
            <hr className="my-3 border-border" />
            <div className="flex items-end justify-between">
              <span className="text-sm font-semibold text-foreground">
                Total
              </span>
              <span className="text-2xl font-extrabold text-primary">
                {formatBRL(confirmed.total)}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <a
              href={orderWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-whatsapp text-sm font-bold text-whatsapp-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Combinar pagamento no WhatsApp
            </a>
            <Link
              href="/conta"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Acompanhar meus pedidos
            </Link>
            <Link
              href="/#produtos"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border text-sm font-bold text-foreground transition-colors hover:border-primary/40"
            >
              Continuar comprando
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 2) Carrinho vazio
  if (ready && cartCount === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 lg:px-8 lg:py-20">
        <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ShoppingBag className="h-8 w-8" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-serif text-2xl font-semibold text-foreground">
            Seu carrinho está vazio
          </h1>
          <p className="mx-auto mt-2 max-w-md text-pretty text-sm text-muted-foreground">
            Adicione peças ao carrinho para finalizar o pedido.
          </p>
          <Link
            href="/#produtos"
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Ver produtos
          </Link>
        </div>
      </div>
    )
  }

  const summary = (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-serif text-xl font-semibold text-foreground">
        Resumo do pedido
      </h2>

      <ul className="mt-4 flex flex-col gap-3">
        {cartItems.map((item) => (
          <li key={item.product.id} className="flex gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
              <Image
                src={item.product.image || '/placeholder.svg'}
                alt={item.product.name}
                fill
                sizes="64px"
                className="object-cover"
              />
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                {item.quantity}
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-center">
              <p className="text-sm font-bold leading-tight text-foreground">
                {item.product.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {[item.product.color, item.product.size]
                  .filter(Boolean)
                  .join(' · Tam ')}
              </p>
            </div>
            <span className="self-center text-sm font-bold text-foreground">
              {formatBRL(item.product.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <hr className="my-4 border-border" />

      {/* Cupom de desconto — começa vazio; nada é aplicado sem ação do cliente. */}
      {appliedCoupon ? (
        <div className="flex items-center justify-between rounded-xl bg-primary/10 px-3 py-2">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-primary">
            <Check className="h-4 w-4" aria-hidden="true" />
            Cupom {appliedCoupon}
          </span>
          <button
            type="button"
            onClick={removeCoupon}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Remover
          </button>
        </div>
      ) : (
        <div>
          <label
            htmlFor="checkout-coupon"
            className="mb-1.5 inline-flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <Tag className="h-4 w-4 text-primary" aria-hidden="true" />
            Cupom de desconto
          </label>
          <div className="flex gap-2">
            <input
              id="checkout-coupon"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  applyCoupon()
                }
              }}
              placeholder="Digite seu cupom"
              className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm uppercase text-foreground outline-none transition-colors placeholder:normal-case placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={applyingCoupon || !couponInput.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {applyingCoupon ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                'Aplicar'
              )}
            </button>
          </div>
          {couponError && (
            <p className="mt-2 text-xs font-medium text-destructive">
              {couponError}
            </p>
          )}
        </div>
      )}

      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-semibold text-foreground">
            {formatBRL(subtotal)}
          </dd>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Desconto</dt>
            <dd className="font-semibold text-primary">
              - {formatBRL(discount)}
            </dd>
          </div>
        )}
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Entrega</dt>
          <dd className="font-semibold text-foreground">
            {deliveryFee === 0 ? (
              <span className="text-primary">Grátis</span>
            ) : (
              formatBRL(deliveryFee)
            )}
          </dd>
        </div>
      </dl>

      <hr className="my-4 border-border" />

      <div className="flex items-end justify-between">
        <span className="text-sm font-semibold text-foreground">Total</span>
        <span className="text-2xl font-extrabold text-foreground">
          {formatBRL(total)}
        </span>
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3">
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <p className="text-xs font-medium text-destructive">{error}</p>
        </div>
      )}

      <div className="mt-5 hidden flex-col gap-3 lg:flex">
        <button
          type="submit"
          form="checkout-form"
          disabled={submitting}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              {payment === 'mercadopago'
                ? 'Abrindo pagamento...'
                : 'Enviando pedido...'}
            </>
          ) : (
            <>
              <Zap className="h-5 w-5" aria-hidden="true" />
              {payment === 'mercadopago'
                ? 'Ir para o pagamento'
                : 'Finalizar pedido'}
            </>
          )}
        </button>
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

      <div className="mt-5 flex items-start gap-2 rounded-2xl bg-muted/60 p-3">
        <Lock
          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <p className="text-xs text-muted-foreground">
          Ambiente 100% seguro. Seus dados são protegidos e usados apenas para
          concluir o pedido.
        </p>
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 pb-40 pt-8 lg:px-8 lg:pb-12 lg:pt-12">
      <a
        href="/carrinho"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Voltar ao carrinho
      </a>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
        Finalizar pedido
      </h1>
      <p className="text-sm text-muted-foreground">
        Falta pouco para receber suas peças cheias de carinho.
      </p>

      {/* Mobile compact summary */}
      <div className="mt-6 lg:hidden">
        <button
          type="button"
          onClick={() => setSummaryOpen((v) => !v)}
          aria-expanded={summaryOpen}
          className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
        >
          <span className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            Ver resumo do pedido
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="text-base font-extrabold text-primary">
              {formatBRL(total)}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                summaryOpen && 'rotate-180',
              )}
              aria-hidden="true"
            />
          </span>
        </button>
        {summaryOpen && <div className="mt-3">{summary}</div>}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Form */}
        <form
          id="checkout-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-6"
        >
          <SectionCard step={1} icon={User} title="Seus dados">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                key={`name-${prefill?.name ?? ''}`}
                id="name"
                label="Nome completo"
                placeholder="Como no documento"
                required
                className="sm:col-span-2"
                defaultValue={prefill?.name}
              />
              <Field
                key={`phone-${prefill?.phone ?? ''}`}
                id="phone"
                label="Telefone / WhatsApp"
                placeholder="(38) 90000-0000"
                type="tel"
                inputMode="tel"
                required
                defaultValue={prefill?.phone}
              />
              <Field
                key={`email-${prefill?.email ?? ''}`}
                id="email"
                label="E-mail"
                placeholder="voce@email.com"
                type="email"
                inputMode="email"
                required
                defaultValue={prefill?.email}
              />
              <Field
                key={`cpf-${prefill?.cpf ?? ''}`}
                id="cpf"
                label="CPF"
                placeholder="000.000.000-00"
                inputMode="numeric"
                className="sm:col-span-2"
                defaultValue={prefill?.cpf}
              />
            </div>
          </SectionCard>

          <SectionCard step={2} icon={MapPin} title="Endereço de entrega">
            <div className="grid gap-4 sm:grid-cols-6">
              <Field
                key={`cep-${prefill?.cep ?? ''}`}
                id="cep"
                label="CEP"
                placeholder="00000-000"
                inputMode="numeric"
                required
                className="sm:col-span-2"
                defaultValue={prefill?.cep}
              />
              <Field
                key={`street-${prefill?.street ?? ''}`}
                id="street"
                label="Rua"
                placeholder="Nome da rua"
                required
                className="sm:col-span-4"
                defaultValue={prefill?.street}
              />
              <Field
                key={`number-${prefill?.number ?? ''}`}
                id="number"
                label="Número"
                placeholder="123"
                inputMode="numeric"
                required
                className="sm:col-span-2"
                defaultValue={prefill?.number}
              />
              <Field
                key={`district-${prefill?.district ?? ''}`}
                id="district"
                label="Bairro"
                placeholder="Seu bairro"
                required
                className="sm:col-span-4"
                defaultValue={prefill?.district}
              />
              <Field
                key={`city-${prefill?.city ?? ''}`}
                id="city"
                label="Cidade"
                placeholder="Curvelo"
                required
                className="sm:col-span-3"
                defaultValue={prefill?.city}
              />
              <Field
                key={`state-${prefill?.state ?? ''}`}
                id="state"
                label="Estado"
                placeholder="MG"
                required
                className="sm:col-span-1"
                defaultValue={prefill?.state}
              />
              <Field
                key={`complement-${prefill?.complement ?? ''}`}
                id="complement"
                label="Complemento"
                placeholder="Apto, bloco (opcional)"
                className="sm:col-span-2"
                defaultValue={prefill?.complement}
              />
            </div>
          </SectionCard>

          <SectionCard step={3} icon={Truck} title="Como você quer receber">
            <div className="flex flex-col gap-3">
              {deliveryOptions.map((opt) => {
                const active = delivery === opt.id
                return (
                  <label
                    key={opt.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors',
                      active
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/40',
                    )}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value={opt.id}
                      checked={active}
                      onChange={() => setDelivery(opt.id)}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <opt.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-bold text-foreground">
                        {opt.title}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {opt.desc}
                      </span>
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {opt.price === 0 ? (
                        <span className="text-primary">
                          {opt.badge ?? 'Grátis'}
                        </span>
                      ) : (
                        formatBRL(opt.price)
                      )}
                    </span>
                  </label>
                )
              })}
            </div>
          </SectionCard>

          <SectionCard step={4} icon={CreditCard} title="Forma de pagamento">
            <div className="flex flex-col gap-3">
              {paymentOptions.map((opt) => {
                const active = payment === opt.id
                return (
                  <label
                    key={opt.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors',
                      active
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/40',
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={opt.id}
                      checked={active}
                      onChange={() => setPayment(opt.id)}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <opt.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-bold text-foreground">
                        {opt.title}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {opt.desc}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full border-2',
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border',
                      )}
                    >
                      {active && <Check className="h-3 w-3" aria-hidden="true" />}
                    </span>
                  </label>
                )
              })}
            </div>
          </SectionCard>

          <SectionCard step={5} icon={MessageSquare} title="Observações do pedido">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="notes" className="sr-only">
                Observações do pedido
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Ponto de referência para entrega"
                className="w-full resize-none rounded-xl border border-border bg-background p-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </SectionCard>

          {/* Trust messages */}
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                icon: Lock,
                title: 'Compra segura',
                desc: 'Seus dados protegidos',
              },
              {
                icon: RefreshCw,
                title: 'Troca fácil',
                desc: 'Até 10 dias para trocar',
              },
              {
                icon: Truck,
                title: 'Entrega rápida',
                desc: 'No mesmo dia em Curvelo',
              },
            ].map((t) => (
              <li
                key={t.title}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <t.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-foreground">
                    {t.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {t.desc}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </form>

        {/* Sticky summary (desktop) */}
        <aside className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
          {summary}
        </aside>
      </div>

      {/* Mobile fixed action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 py-2.5 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex flex-col leading-none">
            <span className="text-[11px] text-muted-foreground">Total</span>
            <span className="text-lg font-extrabold text-primary">
              {formatBRL(finalTotal)}
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
          <button
            type="submit"
            form="checkout-form"
            disabled={submitting}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Zap className="h-5 w-5" aria-hidden="true" />
            )}
            {submitting ? 'Enviando...' : 'Finalizar pedido'}
          </button>
        </div>
      </div>
    </div>
  )
}
