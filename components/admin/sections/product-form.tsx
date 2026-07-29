'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, ImageIcon, Loader2, AlertCircle } from 'lucide-react'
import { brands, allSizes, type ProductStatus } from '../admin-data'
import {
  Panel,
  Field,
  TextInput,
  MoneyInput,
  Select,
  PrimaryButton,
  GhostButton,
} from '../ui'
import { PhotoUploader, type UploadedPhoto } from './photo-uploader'
import {
  createProduct,
  updateProduct,
  getProduct,
  listCategories,
  type AdminCategory,
  type ProductFormValues,
} from '../products-service'

const emptyValues: ProductFormValues = {
  name: '',
  categoryId: '',
  brand: '',
  description: '',
  color: '',
  sizes: [],
  price: 0,
  pixPrice: null,
  promoPrice: null,
  stock: 0,
  status: 'ativo',
  sku: '',
  barcode: '',
  weightKg: null,
  dimensions: '',
}

function toNumber(value: string): number {
  if (!value) return 0
  // Aceita formato brasileiro: "1.234,56" (ponto=milhar, vírgula=decimal)
  let s = value.trim().replace(/[^\d.,-]/g, '')
  if (s.includes('.') && s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (s.includes(',')) {
    s = s.replace(',', '.')
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

export function ProductForm({
  onBack,
  editingId,
}: {
  onBack: (saved?: boolean) => void
  editingId?: string | null
}) {
  const isEditing = Boolean(editingId)
  const [values, setValues] = useState<ProductFormValues>(emptyValues)
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [initialPhotos, setInitialPhotos] = useState<UploadedPhoto[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const cats = await listCategories()
        if (!active) return
        setCategories(cats)
        if (editingId) {
          const detail = await getProduct(editingId)
          if (!active) return
          const { id: _id, photos: loadedPhotos, ...formValues } = detail
          setValues(formValues)
          setInitialPhotos(loadedPhotos)
          setPhotos(loadedPhotos)
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Erro ao carregar dados.',
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [editingId])

  const set = <K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }))

  function toggleSize(size: string) {
    setValues((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }))
  }

  const canSave = useMemo(
    () => values.name.trim().length > 0 && values.price > 0 && !saving,
    [values.name, values.price, saving],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) {
      setError('Informe ao menos o nome e um preço válido.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (isEditing && editingId) {
        await updateProduct(editingId, values, photos)
      } else {
        await createProduct(values, photos)
      }
      onBack(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar o produto.',
      )
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Carregando...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onBack()}
          aria-label="Voltar"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="font-serif text-xl font-semibold text-foreground">
            {isEditing ? 'Editar produto' : 'Novo produto'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Preencha as informações e adicione as fotos.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-secondary bg-secondary/40 px-4 py-3 text-sm text-secondary-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Photos - priority */}
          <Panel className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <h3 className="font-serif text-lg font-semibold text-foreground">
                Fotos do produto
              </h3>
            </div>
            <PhotoUploader initial={initialPhotos} onChange={setPhotos} />
          </Panel>

          {/* Basic info */}
          <Panel className="space-y-4 p-5">
            <h3 className="font-serif text-lg font-semibold text-foreground">
              Informações básicas
            </h3>
            <Field label="Nome do produto">
              <TextInput
                placeholder="Ex.: Vestido Floral Primavera"
                value={values.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoria">
                <Select
                  value={values.categoryId}
                  onChange={(e) => set('categoryId', e.target.value)}
                  className="w-full"
                >
                  <option value="" disabled>
                    Selecione
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Marca">
                <Select
                  value={values.brand}
                  onChange={(e) => set('brand', e.target.value)}
                  className="w-full"
                >
                  <option value="" disabled>
                    Selecione
                  </option>
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Descrição">
              <textarea
                rows={4}
                placeholder="Descreva o material, o caimento e os detalhes especiais da peça."
                value={values.description}
                onChange={(e) => set('description', e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>
          </Panel>

          {/* Variations */}
          <Panel className="space-y-4 p-5">
            <h3 className="font-serif text-lg font-semibold text-foreground">
              Cor e tamanhos
            </h3>
            <Field label="Cor">
              <TextInput
                placeholder="Ex.: Rosa, Azul, Bege"
                value={values.color}
                onChange={(e) => set('color', e.target.value)}
              />
            </Field>
            <Field
              label="Tamanhos disponíveis"
              hint="O estoque informado é distribuído igualmente entre os tamanhos."
            >
              <div className="flex flex-wrap gap-2">
                {allSizes.map((size) => (
                  <label
                    key={size}
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={values.sizes.includes(size)}
                      onChange={() => toggleSize(size)}
                    />
                    {size}
                  </label>
                ))}
              </div>
            </Field>
          </Panel>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Panel className="space-y-4 p-5">
            <h3 className="font-serif text-lg font-semibold text-foreground">
              Preços
            </h3>
            <Field label="Preço (R$)">
              <MoneyInput
                placeholder="129,90"
                value={values.price}
                onValueChange={(n) => set('price', n ?? 0)}
              />
            </Field>
            <Field label="Preço no PIX (R$)" hint="Costuma ter 5% de desconto.">
              <MoneyInput
                allowNull
                placeholder="123,40"
                value={values.pixPrice}
                onValueChange={(n) => set('pixPrice', n)}
              />
            </Field>
            <Field label="Preço promocional (R$)">
              <MoneyInput
                allowNull
                placeholder="Opcional"
                value={values.promoPrice}
                onValueChange={(n) => set('promoPrice', n)}
              />
            </Field>
          </Panel>

          <Panel className="space-y-4 p-5">
            <h3 className="font-serif text-lg font-semibold text-foreground">
              Estoque e status
            </h3>
            <Field label="Estoque">
              <TextInput
                type="number"
                placeholder="0"
                value={values.stock || ''}
                onChange={(e) => set('stock', Math.max(0, Math.round(toNumber(e.target.value))))}
              />
            </Field>
            <Field label="Status">
              <Select
                value={values.status}
                onChange={(e) => set('status', e.target.value as ProductStatus)}
                className="w-full"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="esgotado">Esgotado</option>
              </Select>
            </Field>
          </Panel>

          <Panel className="space-y-4 p-5">
            <h3 className="font-serif text-lg font-semibold text-foreground">
              Identificação e envio
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SKU">
                <TextInput
                  placeholder="ZZB-0001"
                  value={values.sku}
                  onChange={(e) => set('sku', e.target.value)}
                />
              </Field>
              <Field label="Cód. de barras">
                <TextInput
                  placeholder="789..."
                  value={values.barcode}
                  onChange={(e) => set('barcode', e.target.value)}
                />
              </Field>
            </div>
            <Field label="Peso (kg)">
              <MoneyInput
                allowNull
                currency={false}
                placeholder="0,30"
                value={values.weightKg}
                onValueChange={(n) => set('weightKg', n)}
              />
            </Field>
            <Field label="Dimensões (cm)" hint="Largura x Altura x Comprimento">
              <TextInput
                placeholder="20 x 5 x 25"
                value={values.dimensions}
                onChange={(e) => set('dimensions', e.target.value)}
              />
            </Field>
          </Panel>
        </div>
      </div>

      {/* Actions */}
      <div className="sticky bottom-20 z-10 flex flex-col gap-3 rounded-2xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:justify-end lg:bottom-4">
        <GhostButton type="button" onClick={() => onBack()} disabled={saving}>
          Cancelar
        </GhostButton>
        <PrimaryButton type="submit" disabled={!canSave}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Salvar produto
            </>
          )}
        </PrimaryButton>
      </div>
    </form>
  )
}
