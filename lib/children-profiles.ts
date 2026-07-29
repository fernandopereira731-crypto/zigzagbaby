// Estrutura preparada para o Supabase.
//
// Tabela: children_profiles
//   id           uuid  primary key default gen_random_uuid()
//   customer_id  uuid  references customers(id) on delete cascade
//   child_name   text
//   birth_date   date
//   preferred_style text  check (preferred_style in ('menina','menino','unissex','nao-informar'))
//   created_at   timestamptz default now()
//
// Quando o Supabase estiver conectado, troque as funções mock abaixo por
// queries reais (select/insert/update/delete) filtrando SEMPRE por customer_id
// e protegidas por RLS. A UI consome apenas os tipos e helpers deste arquivo,
// portanto nenhum componente precisará mudar.

export type PreferredStyle = 'menina' | 'menino' | 'unissex' | 'nao-informar'

// Sexo da criança (campo distinto do estilo preferido de roupas).
export type ChildSex = 'menino' | 'menina' | 'nao-informar'

export const sexOptions: { value: ChildSex; label: string }[] = [
  { value: 'menina', label: 'Menina' },
  { value: 'menino', label: 'Menino' },
  { value: 'nao-informar', label: 'Prefiro não informar' },
]

export const sexLabels: Record<ChildSex, string> = {
  menina: 'Menina',
  menino: 'Menino',
  'nao-informar': 'Não informado',
}

export type ChildProfile = {
  id: string
  customerId: string
  childName: string
  birthDate: string // formato ISO YYYY-MM-DD
  preferredStyle: PreferredStyle
  createdAt: string
}

export const preferredStyleOptions: {
  value: PreferredStyle
  label: string
}[] = [
  { value: 'menina', label: 'Menina' },
  { value: 'menino', label: 'Menino' },
  { value: 'unissex', label: 'Unissex' },
  { value: 'nao-informar', label: 'Prefiro não informar' },
]

export const preferredStyleLabels: Record<PreferredStyle, string> = {
  menina: 'Menina',
  menino: 'Menino',
  unissex: 'Unissex',
  'nao-informar': 'Não informado',
}

// Mensagem discreta exibida junto aos campos das crianças.
export const CHILDREN_HINT =
  'Essas informações nos ajudam a indicar peças e ofertas especiais para cada fase da criança.'

// Dados simulados enquanto o Supabase não está conectado.
export const childrenProfiles: ChildProfile[] = [
  {
    id: 'ch1',
    customerId: 'cl1',
    childName: 'Helena',
    birthDate: '2023-03-10',
    preferredStyle: 'menina',
    createdAt: '2024-01-12',
  },
  {
    id: 'ch2',
    customerId: 'cl1',
    childName: 'Théo',
    birthDate: '2025-11-02',
    preferredStyle: 'menino',
    createdAt: '2025-11-20',
  },
  {
    id: 'ch3',
    customerId: 'cl3',
    childName: 'Laura',
    birthDate: '2021-07-15',
    preferredStyle: 'menina',
    createdAt: '2023-05-03',
  },
  {
    id: 'ch4',
    customerId: 'cl5',
    childName: 'Miguel',
    birthDate: '2024-01-20',
    preferredStyle: 'menino',
    createdAt: '2024-02-14',
  },
]

export function getChildrenByCustomer(customerId: string): ChildProfile[] {
  return childrenProfiles.filter((c) => c.customerId === customerId)
}

// Calcula a idade da criança de forma amigável (meses para bebês, anos depois).
export function formatChildAge(birthDate: string): string {
  if (!birthDate) return ''
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return ''

  const now = new Date()
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth())
  if (now.getDate() < birth.getDate()) months -= 1

  if (months < 0) return 'a chegar'
  if (months < 1) return 'recém-nascido'
  if (months < 24) {
    return `${months} ${months === 1 ? 'mês' : 'meses'}`
  }

  const years = Math.floor(months / 12)
  const restMonths = months % 12
  if (restMonths === 0) return `${years} anos`
  return `${years} anos e ${restMonths} ${restMonths === 1 ? 'mês' : 'meses'}`
}
