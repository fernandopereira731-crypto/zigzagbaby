'use client'

import { useState } from 'react'
import { Baby, Loader2, Plus, Trash2, X } from 'lucide-react'
import { Field, GhostButton, PrimaryButton, Select, TextInput } from '../ui'
import {
  createCustomer,
  type NewChildInput,
  type NewCustomerInput,
} from '../customers-service'
import { CHILDREN_HINT, sexOptions } from '@/lib/children-profiles'

const ORIGIN_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'loja-online', label: 'Loja online' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'outro', label: 'Outro' },
]

export function NewCustomerModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (id: string, name: string) => void
}) {
  const [form, setForm] = useState<NewCustomerInput>({
    fullName: '',
    phone: '',
    email: '',
    cpf: '',
    birthDate: '',
    notes: '',
    origin: 'whatsapp',
  })
  const [withAddress, setWithAddress] = useState(false)
  const [address, setAddress] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  })
  const [children, setChildren] = useState<NewChildInput[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  function set<K extends keyof NewCustomerInput>(
    key: K,
    value: NewCustomerInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addChild() {
    setChildren((prev) => [
      ...prev,
      { name: '', sex: 'nao-informar', birthDate: '' },
    ])
  }

  function updateChild<K extends keyof NewChildInput>(
    index: number,
    key: K,
    value: NewChildInput[K],
  ) {
    setChildren((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [key]: value } : c)),
    )
  }

  function removeChild(index: number) {
    setChildren((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    if (!form.fullName.trim()) {
      setError('Informe o nome do cliente.')
      return
    }
    // Considera apenas crianças com nome preenchido.
    const validChildren = children
      .map((c) => ({ ...c, name: c.name.trim() }))
      .filter((c) => c.name)
    if (children.some((c) => !c.name.trim() && (c.birthDate || c.sex !== 'nao-informar'))) {
      setError('Informe o nome de cada criança adicionada.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const id = await createCustomer({
        ...form,
        address: withAddress && address.street.trim() ? address : undefined,
        children: validChildren.length > 0 ? validChildren : undefined,
      })
      onCreated(id, form.fullName.trim())
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível cadastrar o cliente.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-background shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Novo cliente
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 space-y-4 overflow-y-auto px-5 py-5"
        >
          <Field label="Nome completo">
            <TextInput
              value={form.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              placeholder="Ex.: Maria Silva"
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Telefone / WhatsApp">
              <TextInput
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="(11) 90000-0000"
                inputMode="tel"
              />
            </Field>
            <Field label="E-mail">
              <TextInput
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="cliente@email.com"
                type="email"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="CPF">
              <TextInput
                value={form.cpf}
                onChange={(e) => set('cpf', e.target.value)}
                placeholder="000.000.000-00"
                inputMode="numeric"
              />
            </Field>
            <Field label="Data de nascimento">
              <TextInput
                value={form.birthDate}
                onChange={(e) => set('birthDate', e.target.value)}
                type="date"
              />
            </Field>
          </div>

          <Field label="Origem do cadastro">
            <Select
              value={form.origin}
              onChange={(e) => set('origin', e.target.value)}
              className="w-full"
            >
              {ORIGIN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Observações">
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              placeholder="Preferências, anotações internas..."
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Baby className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  Crianças
                </span>
              </div>
              <GhostButton
                type="button"
                onClick={addChild}
                className="px-3 py-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar criança
              </GhostButton>
            </div>

            {children.length === 0 ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {CHILDREN_HINT}
              </p>
            ) : (
              <div className="space-y-3">
                {children.map((child, index) => (
                  <div
                    key={index}
                    className="space-y-3 rounded-lg border border-border bg-background p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Criança {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeChild(index)}
                        aria-label={`Remover criança ${index + 1}`}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <Field label="Nome">
                      <TextInput
                        value={child.name}
                        onChange={(e) =>
                          updateChild(index, 'name', e.target.value)
                        }
                        placeholder="Ex.: Helena"
                      />
                    </Field>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Sexo">
                        <Select
                          value={child.sex}
                          onChange={(e) =>
                            updateChild(
                              index,
                              'sex',
                              e.target.value as NewChildInput['sex'],
                            )
                          }
                          className="w-full"
                        >
                          {sexOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Data de nascimento">
                        <TextInput
                          value={child.birthDate}
                          onChange={(e) =>
                            updateChild(index, 'birthDate', e.target.value)
                          }
                          type="date"
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <input
              type="checkbox"
              checked={withAddress}
              onChange={(e) => setWithAddress(e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
            />
            Adicionar endereço de entrega
          </label>

          {withAddress ? (
            <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
              <Field label="Rua / Logradouro">
                <TextInput
                  value={address.street}
                  onChange={(e) =>
                    setAddress((p) => ({ ...p, street: e.target.value }))
                  }
                  placeholder="Rua das Flores"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Número">
                  <TextInput
                    value={address.number}
                    onChange={(e) =>
                      setAddress((p) => ({ ...p, number: e.target.value }))
                    }
                    placeholder="123"
                  />
                </Field>
                <Field label="Complemento">
                  <TextInput
                    value={address.complement}
                    onChange={(e) =>
                      setAddress((p) => ({ ...p, complement: e.target.value }))
                    }
                    placeholder="Apto 45"
                  />
                </Field>
              </div>
              <Field label="Bairro">
                <TextInput
                  value={address.neighborhood}
                  onChange={(e) =>
                    setAddress((p) => ({ ...p, neighborhood: e.target.value }))
                  }
                  placeholder="Centro"
                />
              </Field>
              <div className="grid grid-cols-[1fr_auto_auto] gap-4">
                <Field label="Cidade">
                  <TextInput
                    value={address.city}
                    onChange={(e) =>
                      setAddress((p) => ({ ...p, city: e.target.value }))
                    }
                    placeholder="São Paulo"
                  />
                </Field>
                <Field label="UF">
                  <TextInput
                    value={address.state}
                    onChange={(e) =>
                      setAddress((p) => ({ ...p, state: e.target.value }))
                    }
                    placeholder="SP"
                    className="w-16"
                    maxLength={2}
                  />
                </Field>
                <Field label="CEP">
                  <TextInput
                    value={address.zipCode}
                    onChange={(e) =>
                      setAddress((p) => ({ ...p, zipCode: e.target.value }))
                    }
                    placeholder="00000-000"
                    className="w-28"
                    inputMode="numeric"
                  />
                </Field>
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground">
              {error}
            </p>
          ) : null}
        </form>

        <div className="flex gap-3 border-t border-border px-5 py-4">
          <GhostButton type="button" className="flex-1" onClick={onClose}>
            Cancelar
          </GhostButton>
          <PrimaryButton
            type="button"
            className="flex-1"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Cadastrar cliente
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
