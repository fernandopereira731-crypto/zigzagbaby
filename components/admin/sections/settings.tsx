'use client'

import { useEffect, useState } from 'react'
import {
  Store,
  Share2,
  Truck,
  CreditCard,
  LineChart,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WhatsAppIcon } from '@/components/store/whatsapp-icon'
import { InstagramIcon, FacebookIcon } from '@/components/store/social-icons'
import { Panel, Field, TextInput, MoneyInput, PrimaryButton } from '../ui'
import {
  getStoreSettings,
  saveStoreSettings,
  EMPTY_STORE_SETTINGS,
  type StoreSettings,
} from '../store-settings-service'

const tabs = [
  { id: 'loja', label: 'Loja', icon: Store },
  { id: 'redes', label: 'Redes sociais', icon: Share2 },
  { id: 'entrega', label: 'Entrega', icon: Truck },
  { id: 'pagamento', label: 'Pagamento', icon: CreditCard },
  { id: 'integracoes', label: 'Integrações', icon: LineChart },
] as const

type TabId = (typeof tabs)[number]['id']

export function SettingsSection() {
  const [tab, setTab] = useState<TabId>('loja')
  const [store, setStore] = useState<StoreSettings>(EMPTY_STORE_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await getStoreSettings()
        if (active) setStore(data)
      } catch (err) {
        if (active)
          setError(
            err instanceof Error
              ? err.message
              : 'Não foi possível carregar as configurações.',
          )
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  function setField<K extends keyof StoreSettings>(
    key: K,
    value: StoreSettings[K],
  ) {
    setStore((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await saveStoreSettings(store)
      setSaved(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar as configurações.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="ml-2 text-sm">Carregando configurações...</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        {tabs.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted',
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSave()
        }}
        className="space-y-5"
      >
        {tab === 'loja' && (
          <Panel className="space-y-4 p-5">
            <SectionTitle icon={Store} title="Dados da loja" />
            <p className="text-xs text-muted-foreground">
              Estas informações aparecem no comprovante de pedido.
            </p>
            <Field label="Nome da loja">
              <TextInput
                value={store.storeName}
                onChange={(e) => setField('storeName', e.target.value)}
                placeholder="Zig Zag Baby"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CNPJ" hint="Opcional">
                <TextInput
                  value={store.cnpj ?? ''}
                  onChange={(e) => setField('cnpj', e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </Field>
              <Field label="URL do logo" hint="Opcional">
                <TextInput
                  value={store.logoUrl ?? ''}
                  onChange={(e) => setField('logoUrl', e.target.value)}
                  placeholder="https://..."
                />
              </Field>
            </div>
            <Field label="Endereço">
              <TextInput
                value={store.address ?? ''}
                onChange={(e) => setField('address', e.target.value)}
                placeholder="Rua, número, bairro"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Cidade">
                <TextInput
                  value={store.city ?? ''}
                  onChange={(e) => setField('city', e.target.value)}
                  placeholder="Curvelo"
                />
              </Field>
              <Field label="Estado">
                <TextInput
                  value={store.state ?? ''}
                  onChange={(e) => setField('state', e.target.value)}
                  placeholder="MG"
                />
              </Field>
              <Field label="CEP">
                <TextInput
                  value={store.zipCode ?? ''}
                  onChange={(e) => setField('zipCode', e.target.value)}
                  placeholder="00000-000"
                />
              </Field>
            </div>
            <Field label="Telefone / WhatsApp de atendimento">
              <TextInput
                value={store.phone ?? ''}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="(38) 99999-9999"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prazo para troca (dias)">
                <TextInput
                  type="number"
                  min={0}
                  value={String(store.exchangeDays)}
                  onChange={(e) =>
                    setField('exchangeDays', Number(e.target.value) || 0)
                  }
                />
              </Field>
            </div>
            <Field label="Política de troca (resumo)">
              <textarea
                value={store.exchangePolicy}
                onChange={(e) => setField('exchangePolicy', e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Descreva as regras resumidas de troca"
              />
            </Field>
          </Panel>
        )}

        {tab === 'redes' && (
          <Panel className="space-y-4 p-5">
            <SectionTitle icon={Share2} title="Redes sociais" />
            <Field label="WhatsApp">
              <div className="relative">
                <WhatsAppIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-whatsapp" />
                <TextInput
                  value={store.whatsapp ?? ''}
                  onChange={(e) => setField('whatsapp', e.target.value)}
                  placeholder="Informe o número do WhatsApp"
                  className="pl-11"
                />
              </div>
            </Field>
            <Field label="Instagram">
              <div className="relative">
                <InstagramIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary-foreground" />
                <TextInput
                  value={store.instagram ?? ''}
                  onChange={(e) => setField('instagram', e.target.value)}
                  placeholder="@zigzagbaby"
                  className="pl-11"
                />
              </div>
            </Field>
            <Field label="Facebook">
              <div className="relative">
                <FacebookIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                <TextInput defaultValue="/zigzagbaby" className="pl-11" />
              </div>
            </Field>
          </Panel>
        )}

        {tab === 'entrega' && (
          <Panel className="space-y-4 p-5">
            <SectionTitle icon={Truck} title="Entrega em Curvelo" />
            <Toggle
              label="Entrega local em Curvelo"
              hint="Ative para oferecer entrega na cidade"
              defaultOn
            />
            <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Valor mínimo do pedido (R$)">
              <MoneyInput defaultValue={80} />
            </Field>
            <Field label="Valor do frete (R$)">
              <MoneyInput defaultValue={9.9} />
            </Field>
          </div>
          <Field
            label="Frete grátis acima de (R$)"
            hint="Deixe em branco para desativar"
          >
            <MoneyInput defaultValue={199} />
          </Field>
          </Panel>
        )}

        {tab === 'pagamento' && (
          <Panel className="space-y-4 p-5">
            <SectionTitle icon={CreditCard} title="Formas de pagamento" />
            <Field label="Chave PIX">
              <TextInput defaultValue="financeiro@zigzagbaby.com.br" />
            </Field>
            <Toggle label="Aceitar PIX" hint="Com 5% de desconto" defaultOn />
            <Field label="Token do Mercado Pago">
              <TextInput
                type="password"
                defaultValue="APP_USR-000000000000"
                placeholder="Cole o token de produção"
              />
            </Field>
            <Toggle label="Cartão via Mercado Pago" defaultOn />
          </Panel>
        )}

        {tab === 'integracoes' && (
          <Panel className="space-y-4 p-5">
            <SectionTitle icon={LineChart} title="Integrações e análise" />
            <Field label="Google Analytics (ID)">
              <TextInput placeholder="G-XXXXXXXXXX" />
            </Field>
            <Field label="Facebook Pixel (ID)">
              <TextInput placeholder="000000000000000" />
            </Field>
            <p className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
              Painel preparado para conectar ao banco de dados Supabase e
              persistir estas configurações em produção.
            </p>
          </Panel>
        )}

        {error && (
          <p className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          {saved && !saving && (
            <span className="text-sm font-semibold text-whatsapp">
              Alterações salvas
            </span>
          )}
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Salvar alterações
              </>
            )}
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof Store
  title: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="font-serif text-lg font-semibold text-foreground">
        {title}
      </h3>
    </div>
  )
}

function Toggle({
  label,
  hint,
  defaultOn,
}: {
  label: string
  hint?: string
  defaultOn?: boolean
}) {
  const [on, setOn] = useState(!!defaultOn)
  return (
    <div className="flex items-center justify-between rounded-xl border border-border p-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => setOn((v) => !v)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          on ? 'bg-primary' : 'bg-muted',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform',
            on ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}
