import { getSupabaseBrowserClient } from './auth/supabase-client'

export type BirthdayLead = {
  customer_name: string
  phone: string | null
  child_name: string
  birth_date: string
  day: number
}

export type SimpleLead = {
  customer_name: string
  phone: string | null
  email: string | null
  created_at: string
}

export type RepeatLead = {
  customer_name: string
  phone: string | null
  orders_count: number
  total_spent: number
}

export type MarketingSegments = {
  birthday: BirthdayLead[]
  no_purchase: SimpleLead[]
  recent: SimpleLead[]
  repeat: RepeatLead[]
}

const EMPTY: MarketingSegments = {
  birthday: [],
  no_purchase: [],
  recent: [],
  repeat: [],
}

export async function getMarketingSegments(): Promise<MarketingSegments> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return EMPTY

  const { data, error } = await supabase.rpc('admin_marketing_segments')
  if (error) {
    console.log('[v0] getMarketingSegments error:', error.message)
    throw new Error('Não foi possível carregar os segmentos de marketing.')
  }

  const parsed = (data ?? {}) as Partial<MarketingSegments>
  return {
    birthday: parsed.birthday ?? [],
    no_purchase: parsed.no_purchase ?? [],
    recent: parsed.recent ?? [],
    repeat: parsed.repeat ?? [],
  }
}
