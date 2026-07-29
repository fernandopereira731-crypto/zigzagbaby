import { getSupabaseBrowserClient } from './auth/supabase-client'

function client() {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    throw new Error('Supabase não está conectado.')
  }
  return supabase
}

export type CouponDiscountType = 'percent' | 'fixed'

export interface Coupon {
  id: string
  code: string
  description: string | null
  discountType: CouponDiscountType
  discountValue: number
  minOrder: number
  isActive: boolean
  expiresAt: string | null
  maxUses: number | null
  usedCount: number
  createdAt: string
}

export interface CouponInput {
  code: string
  description: string | null
  discountType: CouponDiscountType
  discountValue: number
  minOrder: number
  isActive: boolean
  expiresAt: string | null
  maxUses: number | null
}

interface CouponRow {
  id: string
  code: string
  description: string | null
  discount_type: string
  discount_value: number
  min_order: number
  is_active: boolean
  expires_at: string | null
  max_uses: number | null
  used_count: number
  created_at: string
}

function mapCoupon(row: CouponRow): Coupon {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type === 'fixed' ? 'fixed' : 'percent',
    discountValue: Number(row.discount_value),
    minOrder: Number(row.min_order),
    isActive: row.is_active,
    expiresAt: row.expires_at,
    maxUses: row.max_uses,
    usedCount: row.used_count,
    createdAt: row.created_at,
  }
}

export async function listCoupons(): Promise<Coupon[]> {
  const supabase = client()
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data as CouponRow[]).map(mapCoupon)
}

export async function createCoupon(input: CouponInput): Promise<Coupon> {
  const supabase = client()
  const { data, error } = await supabase
    .from('coupons')
    .insert({
      code: input.code.trim().toUpperCase(),
      description: input.description,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      min_order: input.minOrder,
      is_active: input.isActive,
      expires_at: input.expiresAt,
      max_uses: input.maxUses,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return mapCoupon(data as CouponRow)
}

export async function updateCoupon(
  id: string,
  input: CouponInput,
): Promise<Coupon> {
  const supabase = client()
  const { data, error } = await supabase
    .from('coupons')
    .update({
      code: input.code.trim().toUpperCase(),
      description: input.description,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      min_order: input.minOrder,
      is_active: input.isActive,
      expires_at: input.expiresAt,
      max_uses: input.maxUses,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return mapCoupon(data as CouponRow)
}

export async function toggleCouponActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  const supabase = client()
  const { error } = await supabase
    .from('coupons')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteCoupon(id: string): Promise<void> {
  const supabase = client()
  const { error } = await supabase.from('coupons').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export interface CouponValidationResult {
  valid: boolean
  message: string
  coupon?: Coupon
}

/**
 * Valida um cupom pelo código para uso público no carrinho/checkout.
 * subtotal é usado para conferir o pedido mínimo.
 */
export async function validateCoupon(
  code: string,
  subtotal: number,
): Promise<CouponValidationResult> {
  const supabase = client()
  const normalized = code.trim().toUpperCase()

  if (!normalized) {
    return { valid: false, message: 'Informe um código de cupom.' }
  }

  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .ilike('code', normalized)
    .maybeSingle()

  if (error) {
    return { valid: false, message: 'Não foi possível validar o cupom.' }
  }
  if (!data) {
    return { valid: false, message: 'Cupom inválido.' }
  }

  const coupon = mapCoupon(data as CouponRow)

  if (!coupon.isActive) {
    return { valid: false, message: 'Este cupom não está mais ativo.' }
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, message: 'Este cupom expirou.' }
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return {
      valid: false,
      message: 'Este cupom atingiu o limite de utilizações.',
    }
  }
  if (subtotal < coupon.minOrder) {
    return {
      valid: false,
      message: `Pedido mínimo de ${coupon.minOrder.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })} para usar este cupom.`,
    }
  }

  return { valid: true, message: 'Cupom aplicado!', coupon }
}

/** Calcula o valor de desconto para um cupom dado o subtotal. */
export function calcCouponDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.discountType === 'fixed') {
    return Math.min(coupon.discountValue, subtotal)
  }
  return Math.round(((subtotal * coupon.discountValue) / 100) * 100) / 100
}
