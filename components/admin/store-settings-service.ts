'use client'

import { getSupabaseBrowserClient } from './auth/supabase-client'

/**
 * Camada de acesso às configurações da loja (tabela `store_settings`,
 * linha única). Usada tanto pela aba "Configurações" do painel quanto
 * pelo comprovante de pedido. A leitura é liberada; a escrita exige admin
 * (garantido pela RLS).
 */

export type StoreSettings = {
  storeName: string
  logoUrl: string | null
  cnpj: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  phone: string | null
  whatsapp: string | null
  instagram: string | null
  exchangeDays: number
  exchangePolicy: string
}

export const EMPTY_STORE_SETTINGS: StoreSettings = {
  storeName: 'Zig Zag Baby',
  logoUrl: null,
  cnpj: null,
  address: null,
  city: null,
  state: null,
  zipCode: null,
  phone: null,
  whatsapp: null,
  instagram: null,
  exchangeDays: 10,
  exchangePolicy:
    'Trocas em até 10 dias mediante apresentação deste comprovante. A peça deve estar sem sinais de uso, com etiqueta e em perfeito estado.',
}

function client() {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error('Supabase não está conectado.')
  return supabase
}

function mapRow(row: any): StoreSettings {
  return {
    storeName: row.store_name ?? 'Zig Zag Baby',
    logoUrl: row.logo_url ?? null,
    cnpj: row.cnpj ?? null,
    address: row.address ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    zipCode: row.zip_code ?? null,
    phone: row.phone ?? null,
    whatsapp: row.whatsapp ?? null,
    instagram: row.instagram ?? null,
    exchangeDays: Number(row.exchange_days) || 10,
    exchangePolicy: row.exchange_policy ?? EMPTY_STORE_SETTINGS.exchangePolicy,
  }
}

/** Lê a configuração da loja. Retorna os padrões se ainda não houver linha. */
export async function getStoreSettings(): Promise<StoreSettings> {
  const supabase = client()
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('id', true)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return EMPTY_STORE_SETTINGS
  return mapRow(data)
}

/** Salva a configuração da loja (upsert na linha única). Somente admin. */
export async function saveStoreSettings(
  input: StoreSettings,
): Promise<void> {
  const supabase = client()
  const { error } = await supabase.from('store_settings').upsert(
    {
      id: true,
      store_name: input.storeName.trim() || 'Zig Zag Baby',
      logo_url: input.logoUrl?.trim() || null,
      cnpj: input.cnpj?.trim() || null,
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      zip_code: input.zipCode?.trim() || null,
      phone: input.phone?.trim() || null,
      whatsapp: input.whatsapp?.trim() || null,
      instagram: input.instagram?.trim() || null,
      exchange_days: Number.isFinite(input.exchangeDays)
        ? Math.max(0, Math.trunc(input.exchangeDays))
        : 10,
      exchange_policy:
        input.exchangePolicy.trim() || EMPTY_STORE_SETTINGS.exchangePolicy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )
  if (error) throw new Error(error.message)
}
