'use client'

import { useEffect, useState } from 'react'
import {
  Cake,
  UserPlus,
  UserX,
  Repeat,
  Sparkles,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { WhatsAppIcon } from '@/components/store/whatsapp-icon'
import { Panel, GhostButton } from '../ui'
import { formatBRL } from '@/lib/format'
import {
  getMarketingSegments,
  type MarketingSegments,
} from '../marketing-service'

/** Monta link de WhatsApp para um telefone específico do cliente. */
function waLink(phone: string | null, message: string) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`
}

const MONTH_NAMES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

type SegmentTone = {
  icon: typeof Cake
  tone: string
}

const TONES: Record<string, SegmentTone> = {
  birthday: { icon: Cake, tone: 'bg-accent/20 text-accent-foreground' },
  recent: { icon: UserPlus, tone: 'bg-whatsapp/10 text-whatsapp' },
  no_purchase: { icon: UserX, tone: 'bg-secondary text-secondary-foreground' },
  repeat: { icon: Repeat, tone: 'bg-primary/10 text-primary' },
}

function ContactButton({
  phone,
  message,
}: {
  phone: string | null
  message: string
}) {
  const link = waLink(phone, message)
  if (!link) {
    return (
      <span className="text-xs text-muted-foreground">Sem telefone</span>
    )
  }
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full bg-whatsapp/10 px-3 py-1.5 text-xs font-bold text-whatsapp transition-colors hover:bg-whatsapp/20"
    >
      <WhatsAppIcon className="h-3.5 w-3.5" />
      Enviar
    </a>
  )
}

function SegmentPanel({
  id,
  title,
  description,
  count,
  children,
}: {
  id: string
  title: string
  description: string
  count: number
  children: React.ReactNode
}) {
  const { icon: Icon, tone } = TONES[id]
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-base font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-foreground">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          Nenhum cliente neste segmento por enquanto.
        </p>
      ) : (
        <div className="divide-y divide-border">{children}</div>
      )}
    </Panel>
  )
}

export function Marketing() {
  const [segments, setSegments] = useState<MarketingSegments | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getMarketingSegments()
      setSegments(data)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Erro ao carregar segmentos.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const currentMonth = MONTH_NAMES[new Date().getMonth()]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Panel className="p-6 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <GhostButton className="mx-auto mt-4" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </GhostButton>
      </Panel>
    )
  }

  const s = segments!

  return (
    <div className="space-y-6">
      {/* Highlight */}
      <Panel className="flex flex-col gap-4 bg-primary/5 p-5 sm:flex-row sm:items-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Sparkles className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Oportunidades de contato
          </h3>
          <p className="text-sm text-muted-foreground">
            Segmentos reais dos seus clientes para você agir agora pelo
            WhatsApp.
          </p>
        </div>
        <GhostButton onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </GhostButton>
      </Panel>

      {/* Aniversariantes */}
      <SegmentPanel
        id="birthday"
        title={`Aniversariantes de ${currentMonth}`}
        description="Crianças que fazem aniversário este mês"
        count={s.birthday.length}
      >
        {s.birthday.map((lead, i) => {
          const day = String(lead.day).padStart(2, '0')
          return (
            <div key={i} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">
                  {lead.child_name}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    dia {day}
                  </span>
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Responsável: {lead.customer_name}
                </p>
              </div>
              <ContactButton
                phone={lead.phone}
                message={`Olá! A ZigZag Baby preparou uma surpresa especial para o aniversário de ${lead.child_name}. Vem conferir!`}
              />
            </div>
          )
        })}
      </SegmentPanel>

      {/* Clientes recentes */}
      <SegmentPanel
        id="recent"
        title="Novos clientes"
        description="Cadastrados nos últimos 30 dias"
        count={s.recent.length}
      >
        {s.recent.map((lead, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">
                {lead.customer_name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {lead.email ?? 'sem e-mail'}
              </p>
            </div>
            <ContactButton
              phone={lead.phone}
              message={`Olá, ${lead.customer_name}! Que bom ter você na ZigZag Baby. Precisa de ajuda para escolher algo especial?`}
            />
          </div>
        ))}
      </SegmentPanel>

      {/* Recorrentes */}
      <SegmentPanel
        id="repeat"
        title="Compradores recorrentes"
        description="Clientes com 2 ou mais pedidos"
        count={s.repeat.length}
      >
        {s.repeat.map((lead, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">
                {lead.customer_name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {lead.orders_count} pedidos · {formatBRL(lead.total_spent)}
              </p>
            </div>
            <ContactButton
              phone={lead.phone}
              message={`Olá, ${lead.customer_name}! Como um dos nossos melhores clientes, temos novidades que você vai amar. Confira!`}
            />
          </div>
        ))}
      </SegmentPanel>

      {/* Sem compra */}
      <SegmentPanel
        id="no_purchase"
        title="Ainda sem compras"
        description="Cadastraram mas não compraram"
        count={s.no_purchase.length}
      >
        {s.no_purchase.map((lead, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">
                {lead.customer_name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {lead.email ?? 'sem e-mail'}
              </p>
            </div>
            <ContactButton
              phone={lead.phone}
              message={`Olá, ${lead.customer_name}! Preparamos um mimo para sua primeira compra na ZigZag Baby. Quer conhecer?`}
            />
          </div>
        ))}
      </SegmentPanel>
    </div>
  )
}
