import { getSupabaseBrowserClient } from './auth/supabase-client'

export type ReportKpis = {
  revenue: number
  orders: number
  avg_ticket: number
  items_sold: number
}

export type SalesByDay = { label: string; revenue: number; orders: number }
export type TopProduct = { name: string; quantity: number; revenue: number }
export type ByCategory = { name: string; revenue: number }
export type ByPayment = { name: string; orders: number; revenue: number }
export type NewCustomers = { label: string; customers: number }
export type ByStatus = { name: string; orders: number }

export type ReportsData = {
  kpis: ReportKpis
  sales_by_day: SalesByDay[]
  top_products: TopProduct[]
  by_category: ByCategory[]
  by_payment: ByPayment[]
  new_customers: NewCustomers[]
  by_status: ByStatus[]
}

const EMPTY: ReportsData = {
  kpis: { revenue: 0, orders: 0, avg_ticket: 0, items_sold: 0 },
  sales_by_day: [],
  top_products: [],
  by_category: [],
  by_payment: [],
  new_customers: [],
  by_status: [],
}

export async function getReports(days: number): Promise<ReportsData> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error('Supabase não está conectado.')

  const { data, error } = await supabase.rpc('admin_reports', {
    p_days: days,
  })
  if (error) throw new Error(error.message)
  if (!data) return EMPTY

  const d = data as Partial<ReportsData>
  return {
    kpis: d.kpis ?? EMPTY.kpis,
    sales_by_day: d.sales_by_day ?? [],
    top_products: d.top_products ?? [],
    by_category: d.by_category ?? [],
    by_payment: d.by_payment ?? [],
    new_customers: d.new_customers ?? [],
    by_status: d.by_status ?? [],
  }
}

/** Gera e dispara o download de um arquivo CSV a partir de linhas. */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const escape = (value: string | number) => {
    const str = String(value ?? '')
    if (/[",\n;]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }
  const content = [headers, ...rows]
    .map((row) => row.map(escape).join(';'))
    .join('\n')
  // BOM para acentuação correta no Excel
  const blob = new Blob(['\uFEFF' + content], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
