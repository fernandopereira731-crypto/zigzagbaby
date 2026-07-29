import { getSupabaseBrowserClient } from './auth/supabase-client'

/* ============================================================
 * Tipos
 * ========================================================== */

export type MovementType =
  | 'sale_cash'
  | 'sale_pix'
  | 'sale_card'
  | 'supply'
  | 'withdrawal'
  | 'expense'
  | 'refund'

export type ExpenseCategory =
  | 'fornecedor'
  | 'embalagem'
  | 'frete'
  | 'combustivel'
  | 'manutencao'
  | 'aluguel'
  | 'agua'
  | 'energia'
  | 'internet'
  | 'marketing'
  | 'outros'

export type Operator = {
  id: string
  fullName: string
  email: string
  role: string
}

export type CashRegister = {
  id: string
  operatorId: string
  operatorName: string
  openingAmount: number
  status: 'open' | 'closed'
  openedAt: string
  closedAt: string | null
  notes: string | null
}

export type CashMovement = {
  id: string
  registerId: string
  type: MovementType
  direction: 'in' | 'out'
  amount: number
  description: string | null
  orderId: string | null
  paymentMethod: string | null
  operatorName: string
  createdAt: string
}

export type ExpenseInput = {
  registerId: string
  description: string
  category: ExpenseCategory
  amount: number
  paymentMethod: string
  supplier?: string
  notes?: string
  receiptFile?: File | null
  incurredAt?: string
}

export type RegisterSummary = {
  openingAmount: number
  salesCash: number
  salesPix: number
  salesCard: number
  supply: number
  withdrawal: number
  expense: number
  refund: number
  /** Saldo esperado em dinheiro (só entradas/saídas em espécie). */
  expectedCash: number
  totalIn: number
  totalOut: number
}

export type CashClosing = {
  id: string
  registerId: string
  openingAmount: number
  totalSalesCash: number
  totalSalesPix: number
  totalSalesCard: number
  totalSupply: number
  totalWithdrawal: number
  totalExpense: number
  totalRefund: number
  expectedCash: number
  countedCash: number
  difference: number
  notes: string | null
  operatorName: string
  closedAt: string
}

export type ImportableOrder = {
  id: string
  orderNumber: string
  customerName: string | null
  paymentMethod: string | null
  total: number
  createdAt: string
}

/* ============================================================
 * Labels (PT-BR)
 * ========================================================== */

export const movementLabels: Record<MovementType, string> = {
  sale_cash: 'Venda em dinheiro',
  sale_pix: 'Venda em PIX',
  sale_card: 'Venda em cartão',
  supply: 'Suprimento',
  withdrawal: 'Sangria',
  expense: 'Despesa',
  refund: 'Estorno',
}

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  fornecedor: 'Fornecedor',
  embalagem: 'Embalagem',
  frete: 'Frete',
  combustivel: 'Combustível',
  manutencao: 'Manutenção',
  aluguel: 'Aluguel',
  agua: 'Água',
  energia: 'Energia',
  internet: 'Internet',
  marketing: 'Marketing',
  outros: 'Outros',
}

/** Entradas (in) vs saídas (out) por tipo de movimento. */
const MOVEMENT_DIRECTION: Record<MovementType, 'in' | 'out'> = {
  sale_cash: 'in',
  sale_pix: 'in',
  sale_card: 'in',
  supply: 'in',
  withdrawal: 'out',
  expense: 'out',
  refund: 'out',
}

/* ============================================================
 * Helpers internos
 * ========================================================== */

function client() {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    throw new Error('Supabase não está conectado.')
  }
  return supabase
}

async function currentOperatorName(): Promise<string> {
  const supabase = client()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão expirada. Faça login novamente.')
  const { data } = await supabase
    .from('admin_profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle()
  return data?.full_name || data?.email || user.email || 'Operador'
}

/* ============================================================
 * Operadores
 * ========================================================== */

export async function listOperators(): Promise<Operator[]> {
  const supabase = client()
  const { data, error } = await supabase.rpc('list_cash_operators')
  if (error) throw new Error(error.message)
  return (data ?? []).map((o: any) => ({
    id: o.id,
    fullName: o.full_name || o.email || 'Operador',
    email: o.email ?? '',
    role: o.role ?? '',
  }))
}

/* ============================================================
 * Caixas
 * ========================================================== */

function mapRegister(r: any): CashRegister {
  return {
    id: r.id,
    operatorId: r.operator_id,
    operatorName: r.operator_name,
    openingAmount: Number(r.opening_amount) || 0,
    status: r.status,
    openedAt: r.opened_at,
    closedAt: r.closed_at,
    notes: r.notes,
  }
}

/** Retorna o caixa aberto do operador logado, se existir. */
export async function getOpenRegister(): Promise<CashRegister | null> {
  const supabase = client()
  const { data, error } = await supabase
    .from('cash_registers')
    .select('*')
    .eq('status', 'open')
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapRegister(data) : null
}

export async function listRegisters(): Promise<CashRegister[]> {
  const supabase = client()
  const { data, error } = await supabase
    .from('cash_registers')
    .select('*')
    .order('opened_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRegister)
}

export async function openRegister(input: {
  operatorId: string
  operatorName: string
  openingAmount: number
  notes?: string
}): Promise<CashRegister> {
  const supabase = client()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão expirada. Faça login novamente.')

  // Impede dois caixas abertos para o mesmo operador (checagem amigável;
  // a constraint no banco é a garantia definitiva).
  const { data: existing } = await supabase
    .from('cash_registers')
    .select('id')
    .eq('operator_id', input.operatorId)
    .eq('status', 'open')
    .maybeSingle()
  if (existing) {
    throw new Error('Este operador já possui um caixa aberto.')
  }

  const { data, error } = await supabase
    .from('cash_registers')
    .insert({
      operator_id: input.operatorId,
      operator_name: input.operatorName,
      opening_amount: input.openingAmount,
      opened_by: user.id,
      notes: input.notes || null,
    })
    .select('*')
    .single()
  if (error) {
    if (error.code === '23505') {
      throw new Error('Este operador já possui um caixa aberto.')
    }
    throw new Error(error.message)
  }
  return mapRegister(data)
}

/* ============================================================
 * Movimentações
 * ========================================================== */

function mapMovement(m: any): CashMovement {
  return {
    id: m.id,
    registerId: m.register_id,
    type: m.type,
    direction: m.direction,
    amount: Number(m.amount) || 0,
    description: m.description,
    orderId: m.order_id,
    paymentMethod: m.payment_method,
    operatorName: m.operator_name,
    createdAt: m.created_at,
  }
}

export async function listMovements(
  registerId: string,
): Promise<CashMovement[]> {
  const supabase = client()
  const { data, error } = await supabase
    .from('cash_movements')
    .select('*')
    .eq('register_id', registerId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapMovement)
}

export async function addMovement(input: {
  registerId: string
  type: MovementType
  amount: number
  description?: string
  orderId?: string | null
  paymentMethod?: string | null
}): Promise<CashMovement> {
  const supabase = client()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão expirada. Faça login novamente.')
  if (!(input.amount > 0)) throw new Error('O valor deve ser maior que zero.')

  const operatorName = await currentOperatorName()
  const { data, error } = await supabase
    .from('cash_movements')
    .insert({
      register_id: input.registerId,
      type: input.type,
      direction: MOVEMENT_DIRECTION[input.type],
      amount: input.amount,
      description: input.description || null,
      order_id: input.orderId || null,
      payment_method: input.paymentMethod || null,
      created_by: user.id,
      operator_name: operatorName,
    })
    .select('*')
    .single()
  if (error) {
    if (error.code === '23505') {
      throw new Error('Este pedido já foi lançado no caixa.')
    }
    throw new Error(error.message)
  }
  return mapMovement(data)
}

/* ============================================================
 * Importar vendas dos pedidos da loja
 * ========================================================== */

/** Mapeia a forma de pagamento do pedido para o tipo de movimento de venda. */
function saleTypeFromPayment(pm: string | null): MovementType {
  const v = (pm || '').toLowerCase()
  if (v.includes('pix')) return 'sale_pix'
  if (v.includes('dinheiro') || v.includes('cash') || v.includes('money'))
    return 'sale_cash'
  return 'sale_card'
}

/**
 * Lista pedidos pagos que ainda não foram lançados como venda em nenhum caixa.
 */
export async function listImportableOrders(): Promise<ImportableOrder[]> {
  const supabase = client()
  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      'id, order_number, customer_name, payment_method, total, created_at, payment_status, status',
    )
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)

  const { data: used } = await supabase
    .from('cash_movements')
    .select('order_id')
    .not('order_id', 'is', null)
  const usedIds = new Set((used ?? []).map((m: any) => m.order_id))

  return (orders ?? [])
    .filter((o: any) => {
      if (usedIds.has(o.id)) return false
      // Considera pago quando payment_status = 'paid' OU status avançou.
      const paid =
        o.payment_status === 'paid' ||
        ['paid', 'processing', 'shipped', 'delivered', 'completed'].includes(
          o.status,
        )
      return paid
    })
    .map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      customerName: o.customer_name,
      paymentMethod: o.payment_method,
      total: Number(o.total) || 0,
      createdAt: o.created_at,
    }))
}

/** Lança um pedido da loja como venda no caixa aberto. */
export async function importOrderSale(
  registerId: string,
  order: ImportableOrder,
): Promise<CashMovement> {
  return addMovement({
    registerId,
    type: saleTypeFromPayment(order.paymentMethod),
    amount: order.total,
    description: `Pedido ${order.orderNumber}${
      order.customerName ? ` — ${order.customerName}` : ''
    }`,
    orderId: order.id,
    paymentMethod: order.paymentMethod,
  })
}

/* ============================================================
 * Despesas
 * ========================================================== */

async function uploadReceipt(
  registerId: string,
  file: File,
): Promise<string | null> {
  const supabase = client()
  const ext = file.name.split('.').pop() || 'bin'
  const path = `${registerId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('expense-receipts')
    .upload(path, file, { upsert: false })
  if (error) throw new Error(`Falha ao enviar o comprovante: ${error.message}`)
  return path
}

export async function addExpense(input: ExpenseInput): Promise<void> {
  const supabase = client()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão expirada. Faça login novamente.')
  if (!input.description.trim()) throw new Error('Informe a descrição.')
  if (!(input.amount > 0)) throw new Error('O valor deve ser maior que zero.')

  const operatorName = await currentOperatorName()

  let receiptUrl: string | null = null
  if (input.receiptFile) {
    receiptUrl = await uploadReceipt(input.registerId, input.receiptFile)
  }

  // 1) Registra a movimentação de saída (despesa) para afetar o caixa.
  const movement = await addMovement({
    registerId: input.registerId,
    type: 'expense',
    amount: input.amount,
    description: `${expenseCategoryLabels[input.category]}: ${input.description}`,
    paymentMethod: input.paymentMethod,
  })

  // 2) Registra o detalhamento da despesa.
  const { error } = await supabase.from('expenses').insert({
    register_id: input.registerId,
    movement_id: movement.id,
    description: input.description.trim(),
    category: input.category,
    amount: input.amount,
    payment_method: input.paymentMethod,
    supplier: input.supplier?.trim() || null,
    notes: input.notes?.trim() || null,
    receipt_url: receiptUrl,
    created_by: user.id,
    operator_name: operatorName,
    incurred_at: input.incurredAt || new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
}

export type ExpenseRow = {
  id: string
  registerId: string | null
  description: string
  category: ExpenseCategory
  amount: number
  paymentMethod: string
  supplier: string | null
  notes: string | null
  receiptUrl: string | null
  operatorName: string
  incurredAt: string
}

export async function listExpenses(filters?: {
  registerId?: string
  from?: string
  to?: string
}): Promise<ExpenseRow[]> {
  const supabase = client()
  let q = supabase
    .from('expenses')
    .select('*')
    .order('incurred_at', { ascending: false })
  if (filters?.registerId) q = q.eq('register_id', filters.registerId)
  if (filters?.from) q = q.gte('incurred_at', filters.from)
  if (filters?.to) q = q.lte('incurred_at', filters.to)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []).map((e: any) => ({
    id: e.id,
    registerId: e.register_id,
    description: e.description,
    category: e.category,
    amount: Number(e.amount) || 0,
    paymentMethod: e.payment_method,
    supplier: e.supplier,
    notes: e.notes,
    receiptUrl: e.receipt_url,
    operatorName: e.operator_name,
    incurredAt: e.incurred_at,
  }))
}

/** Gera uma URL assinada temporária para visualizar o comprovante. */
export async function getReceiptUrl(path: string): Promise<string | null> {
  const supabase = client()
  const { data, error } = await supabase.storage
    .from('expense-receipts')
    .createSignedUrl(path, 60 * 10)
  if (error) return null
  return data?.signedUrl ?? null
}

/* ============================================================
 * Resumo e fechamento
 * ========================================================== */

export function summarizeMovements(
  openingAmount: number,
  movements: CashMovement[],
): RegisterSummary {
  const s: RegisterSummary = {
    openingAmount,
    salesCash: 0,
    salesPix: 0,
    salesCard: 0,
    supply: 0,
    withdrawal: 0,
    expense: 0,
    refund: 0,
    expectedCash: 0,
    totalIn: 0,
    totalOut: 0,
  }
  for (const m of movements) {
    switch (m.type) {
      case 'sale_cash':
        s.salesCash += m.amount
        break
      case 'sale_pix':
        s.salesPix += m.amount
        break
      case 'sale_card':
        s.salesCard += m.amount
        break
      case 'supply':
        s.supply += m.amount
        break
      case 'withdrawal':
        s.withdrawal += m.amount
        break
      case 'expense':
        s.expense += m.amount
        break
      case 'refund':
        s.refund += m.amount
        break
    }
    if (m.direction === 'in') s.totalIn += m.amount
    else s.totalOut += m.amount
  }
  // Saldo esperado em espécie: só movimenta dinheiro físico.
  // Entram: troco inicial + vendas em dinheiro + suprimentos.
  // Saem: sangrias + despesas + estornos (assumidos em dinheiro).
  s.expectedCash =
    openingAmount +
    s.salesCash +
    s.supply -
    s.withdrawal -
    s.expense -
    s.refund
  return s
}

export async function closeRegister(input: {
  registerId: string
  countedCash: number
  notes?: string
}): Promise<CashClosing> {
  const supabase = client()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão expirada. Faça login novamente.')

  // Recalcula o resumo no momento do fechamento a partir dos dados reais.
  const register = await supabase
    .from('cash_registers')
    .select('*')
    .eq('id', input.registerId)
    .single()
  if (register.error) throw new Error(register.error.message)
  if (register.data.status === 'closed')
    throw new Error('Este caixa já foi fechado.')

  const movements = await listMovements(input.registerId)
  const summary = summarizeMovements(
    Number(register.data.opening_amount) || 0,
    movements,
  )
  const difference = input.countedCash - summary.expectedCash
  const operatorName = await currentOperatorName()

  // 1) Grava o fechamento (imutável).
  const { data: closing, error: closeErr } = await supabase
    .from('cash_closings')
    .insert({
      register_id: input.registerId,
      opening_amount: summary.openingAmount,
      total_sales_cash: summary.salesCash,
      total_sales_pix: summary.salesPix,
      total_sales_card: summary.salesCard,
      total_supply: summary.supply,
      total_withdrawal: summary.withdrawal,
      total_expense: summary.expense,
      total_refund: summary.refund,
      expected_cash: summary.expectedCash,
      counted_cash: input.countedCash,
      difference,
      notes: input.notes || null,
      closed_by: user.id,
      operator_name: operatorName,
    })
    .select('*')
    .single()
  if (closeErr) throw new Error(closeErr.message)

  // 2) Marca o caixa como fechado.
  const { error: updErr } = await supabase
    .from('cash_registers')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', input.registerId)
  if (updErr) throw new Error(updErr.message)

  return {
    id: closing.id,
    registerId: closing.register_id,
    openingAmount: Number(closing.opening_amount) || 0,
    totalSalesCash: Number(closing.total_sales_cash) || 0,
    totalSalesPix: Number(closing.total_sales_pix) || 0,
    totalSalesCard: Number(closing.total_sales_card) || 0,
    totalSupply: Number(closing.total_supply) || 0,
    totalWithdrawal: Number(closing.total_withdrawal) || 0,
    totalExpense: Number(closing.total_expense) || 0,
    totalRefund: Number(closing.total_refund) || 0,
    expectedCash: Number(closing.expected_cash) || 0,
    countedCash: Number(closing.counted_cash) || 0,
    difference: Number(closing.difference) || 0,
    notes: closing.notes,
    operatorName: closing.operator_name,
    closedAt: closing.closed_at,
  }
}

export async function getClosing(
  registerId: string,
): Promise<CashClosing | null> {
  const supabase = client()
  const { data, error } = await supabase
    .from('cash_closings')
    .select('*')
    .eq('register_id', registerId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return {
    id: data.id,
    registerId: data.register_id,
    openingAmount: Number(data.opening_amount) || 0,
    totalSalesCash: Number(data.total_sales_cash) || 0,
    totalSalesPix: Number(data.total_sales_pix) || 0,
    totalSalesCard: Number(data.total_sales_card) || 0,
    totalSupply: Number(data.total_supply) || 0,
    totalWithdrawal: Number(data.total_withdrawal) || 0,
    totalExpense: Number(data.total_expense) || 0,
    totalRefund: Number(data.total_refund) || 0,
    expectedCash: Number(data.expected_cash) || 0,
    countedCash: Number(data.counted_cash) || 0,
    difference: Number(data.difference) || 0,
    notes: data.notes,
    operatorName: data.operator_name,
    closedAt: data.closed_at,
  }
}

/* ============================================================
 * Relatórios
 * ========================================================== */

export type ReportFilters = { from?: string; to?: string }

export async function getExpensesByCategory(
  filters?: ReportFilters,
): Promise<{ category: ExpenseCategory; total: number; count: number }[]> {
  const expenses = await listExpenses(filters)
  const map = new Map<ExpenseCategory, { total: number; count: number }>()
  for (const e of expenses) {
    const cur = map.get(e.category) ?? { total: 0, count: 0 }
    cur.total += e.amount
    cur.count += 1
    map.set(e.category, cur)
  }
  return Array.from(map.entries())
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.total - a.total)
}

export type OperatorSales = {
  operatorName: string
  salesTotal: number
  registers: number
  differenceTotal: number
}

/** Vendas e diferenças agregadas por operador (a partir dos fechamentos). */
export async function getSalesByOperator(
  filters?: ReportFilters,
): Promise<OperatorSales[]> {
  const supabase = client()
  let q = supabase.from('cash_closings').select('*')
  if (filters?.from) q = q.gte('closed_at', filters.from)
  if (filters?.to) q = q.lte('closed_at', filters.to)
  const { data, error } = await q
  if (error) throw new Error(error.message)

  const map = new Map<string, OperatorSales>()
  for (const c of data ?? []) {
    const name = c.operator_name || 'Operador'
    const cur =
      map.get(name) ??
      ({
        operatorName: name,
        salesTotal: 0,
        registers: 0,
        differenceTotal: 0,
      } as OperatorSales)
    cur.salesTotal +=
      Number(c.total_sales_cash) +
      Number(c.total_sales_pix) +
      Number(c.total_sales_card)
    cur.differenceTotal += Number(c.difference) || 0
    cur.registers += 1
    map.set(name, cur)
  }
  return Array.from(map.values()).sort((a, b) => b.salesTotal - a.salesTotal)
}

export type DailyBalance = {
  day: string
  totalIn: number
  totalOut: number
  net: number
}

/** Saldo diário (entradas e saídas) a partir das movimentações. */
export async function getDailyBalance(
  filters?: ReportFilters,
): Promise<DailyBalance[]> {
  const supabase = client()
  let q = supabase
    .from('cash_movements')
    .select('direction, amount, created_at')
  if (filters?.from) q = q.gte('created_at', filters.from)
  if (filters?.to) q = q.lte('created_at', filters.to)
  const { data, error } = await q
  if (error) throw new Error(error.message)

  const map = new Map<string, DailyBalance>()
  for (const m of data ?? []) {
    const day = String(m.created_at).slice(0, 10)
    const cur =
      map.get(day) ?? ({ day, totalIn: 0, totalOut: 0, net: 0 } as DailyBalance)
    if (m.direction === 'in') cur.totalIn += Number(m.amount)
    else cur.totalOut += Number(m.amount)
    cur.net = cur.totalIn - cur.totalOut
    map.set(day, cur)
  }
  return Array.from(map.values()).sort((a, b) => (a.day < b.day ? 1 : -1))
}

export type AuditEntry = {
  id: string
  action: string
  entity: string
  actorName: string | null
  createdAt: string
}

export async function listAudit(registerId?: string): Promise<AuditEntry[]> {
  const supabase = client()
  let q = supabase
    .from('cash_audit_log')
    .select('id, action, entity, actor_name, created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  if (registerId) q = q.eq('register_id', registerId)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []).map((a: any) => ({
    id: a.id,
    action: a.action,
    entity: a.entity,
    actorName: a.actor_name,
    createdAt: a.created_at,
  }))
}
