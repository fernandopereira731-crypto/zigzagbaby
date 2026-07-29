import { whatsappUrl } from '@/lib/site'

export type AdminOrderStatus =
  | 'pendente'
  | 'pago'
  | 'enviado'
  | 'entregue'
  | 'cancelado'

export type ProductStatus = 'ativo' | 'inativo' | 'esgotado'

export type AdminProduct = {
  id: string
  name: string
  image: string
  category: string
  brand: string
  price: number
  stock: number
  sizes: string[]
  status: ProductStatus
}

export type AdminOrder = {
  id: string
  customer: string
  city: string
  total: number
  payment: 'PIX' | 'Cartão' | 'Dinheiro'
  status: AdminOrderStatus
  date: string
  items: number
}

export type AdminCustomer = {
  id: string
  name: string
  city: string
  phone: string
  lastPurchase: string
  totalSpent: number
  orders: number
}

export type Coupon = {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  minValue: number
  expires: string
  maxUses: number
  used: number
  active: boolean
}

export const admin = {
  name: 'Fernando',
  fullName: 'Fernando Mendes',
  email: 'fernando@zigzagbaby.com.br',
  role: 'Proprietário',
}

export const metrics = {
  ordersToday: 14,
  salesToday: 1890.5,
  monthRevenue: 42350.8,
  activeProducts: 128,
  lowStock: 7,
  customers: 843,
  averageTicket: 135.04,
  topSellingCount: 312,
  pendingOrders: 6,
  shippedOrders: 23,
  canceledOrders: 2,
}

export const categories = [
  { id: 'c1', name: 'Meninas', products: 42, active: true },
  { id: 'c2', name: 'Meninos', products: 38, active: true },
  { id: 'c3', name: 'Recém-nascido', products: 24, active: true },
  { id: 'c4', name: 'Unissex', products: 18, active: true },
  { id: 'c5', name: 'Promoções', products: 12, active: true },
  { id: 'c6', name: 'Calçados', products: 6, active: false },
]

export const brands = ['Zig Zag Baby', 'Puc', 'Kyly', 'Milon', 'Hering Kids']
export const allSizes = ['RN', '3 meses', '6 meses', '1 ano', '2 anos', '3 anos', '4 anos']

export const products: AdminProduct[] = [
  {
    id: 'p1',
    name: 'Vestido Floral Primavera',
    image: '/images/product-1.png',
    category: 'Meninas',
    brand: 'Zig Zag Baby',
    price: 129.9,
    stock: 24,
    sizes: ['1 ano', '2 anos', '3 anos'],
    status: 'ativo',
  },
  {
    id: 'p2',
    name: 'Suéter Tricô Azul',
    image: '/images/product-2.png',
    category: 'Meninos',
    brand: 'Milon',
    price: 119.9,
    stock: 3,
    sizes: ['6 meses', '1 ano'],
    status: 'ativo',
  },
  {
    id: 'p3',
    name: 'Body Básico Algodão',
    image: '/images/product-3.png',
    category: 'Recém-nascido',
    brand: 'Kyly',
    price: 39.9,
    stock: 60,
    sizes: ['RN', '3 meses', '6 meses'],
    status: 'ativo',
  },
  {
    id: 'p4',
    name: 'Conjunto Aventura',
    image: '/images/product-4.png',
    category: 'Meninos',
    brand: 'Puc',
    price: 99.9,
    stock: 0,
    sizes: ['2 anos', '3 anos'],
    status: 'esgotado',
  },
  {
    id: 'p5',
    name: 'Conjunto Bem-te-vi',
    image: '/images/product-5.png',
    category: 'Unissex',
    brand: 'Hering Kids',
    price: 149.9,
    stock: 18,
    sizes: ['1 ano', '2 anos'],
    status: 'ativo',
  },
  {
    id: 'p6',
    name: 'Macacão Soft Sage',
    image: '/images/product-6.png',
    category: 'Unissex',
    brand: 'Zig Zag Baby',
    price: 89.9,
    stock: 2,
    sizes: ['3 meses', '6 meses'],
    status: 'ativo',
  },
  {
    id: 'p7',
    name: 'Vestido Festa Cerejeira',
    image: '/images/product-1b.png',
    category: 'Meninas',
    brand: 'Milon',
    price: 179.9,
    stock: 9,
    sizes: ['2 anos', '3 anos', '4 anos'],
    status: 'inativo',
  },
  {
    id: 'p8',
    name: 'Body Manga Longa Bege',
    image: '/images/product-3b.png',
    category: 'Recém-nascido',
    brand: 'Kyly',
    price: 44.9,
    stock: 5,
    sizes: ['RN', '3 meses'],
    status: 'ativo',
  },
]

export const orders: AdminOrder[] = [
  {
    id: '#ZZB-1042',
    customer: 'Mariana Oliveira',
    city: 'Curvelo - MG',
    total: 259.6,
    payment: 'PIX',
    status: 'enviado',
    date: '02 jul 2026',
    items: 3,
  },
  {
    id: '#ZZB-1041',
    customer: 'Patrícia Souza',
    city: 'Curvelo - MG',
    total: 149.9,
    payment: 'Cartão',
    status: 'pendente',
    date: '02 jul 2026',
    items: 1,
  },
  {
    id: '#ZZB-1040',
    customer: 'Juliana Castro',
    city: 'Corinto - MG',
    total: 329.7,
    payment: 'PIX',
    status: 'pago',
    date: '01 jul 2026',
    items: 4,
  },
  {
    id: '#ZZB-1039',
    customer: 'Ana Beatriz Lima',
    city: 'Curvelo - MG',
    total: 89.9,
    payment: 'Dinheiro',
    status: 'entregue',
    date: '01 jul 2026',
    items: 1,
  },
  {
    id: '#ZZB-1038',
    customer: 'Camila Ferreira',
    city: 'Três Marias - MG',
    total: 199.8,
    payment: 'PIX',
    status: 'pendente',
    date: '30 jun 2026',
    items: 2,
  },
  {
    id: '#ZZB-1037',
    customer: 'Renata Alves',
    city: 'Curvelo - MG',
    total: 119.9,
    payment: 'Cartão',
    status: 'cancelado',
    date: '30 jun 2026',
    items: 1,
  },
  {
    id: '#ZZB-1036',
    customer: 'Fernanda Dias',
    city: 'Curvelo - MG',
    total: 279.5,
    payment: 'PIX',
    status: 'entregue',
    date: '29 jun 2026',
    items: 3,
  },
]

export const customers: AdminCustomer[] = [
  {
    id: 'cl1',
    name: 'Mariana Oliveira',
    city: 'Curvelo - MG',
    phone: '(38) 99999-0000',
    lastPurchase: '02 jul 2026',
    totalSpent: 1289.4,
    orders: 8,
  },
  {
    id: 'cl2',
    name: 'Patrícia Souza',
    city: 'Curvelo - MG',
    phone: '(38) 98888-1122',
    lastPurchase: '02 jul 2026',
    totalSpent: 640.7,
    orders: 4,
  },
  {
    id: 'cl3',
    name: 'Juliana Castro',
    city: 'Corinto - MG',
    phone: '(38) 97777-3344',
    lastPurchase: '01 jul 2026',
    totalSpent: 2109.3,
    orders: 12,
  },
  {
    id: 'cl4',
    name: 'Ana Beatriz Lima',
    city: 'Curvelo - MG',
    phone: '(38) 96666-5566',
    lastPurchase: '01 jul 2026',
    totalSpent: 329.9,
    orders: 2,
  },
  {
    id: 'cl5',
    name: 'Camila Ferreira',
    city: 'Três Marias - MG',
    phone: '(38) 95555-7788',
    lastPurchase: '30 jun 2026',
    totalSpent: 889.6,
    orders: 5,
  },
  {
    id: 'cl6',
    name: 'Renata Alves',
    city: 'Curvelo - MG',
    phone: '(38) 94444-9900',
    lastPurchase: '30 jun 2026',
    totalSpent: 459.8,
    orders: 3,
  },
]

export const coupons: Coupon[] = [
  {
    id: 'cp1',
    code: 'BEMVINDO',
    type: 'percent',
    value: 10,
    minValue: 99,
    expires: '31 dez 2026',
    maxUses: 500,
    used: 213,
    active: true,
  },
  {
    id: 'cp2',
    code: 'ZIGZAG10',
    type: 'percent',
    value: 10,
    minValue: 150,
    expires: '30 set 2026',
    maxUses: 300,
    used: 87,
    active: true,
  },
  {
    id: 'cp3',
    code: 'FRETEGRATIS',
    type: 'fixed',
    value: 15,
    minValue: 200,
    expires: '15 ago 2026',
    maxUses: 100,
    used: 100,
    active: false,
  },
]

export const topProducts = [
  { name: 'Vestido Floral', sold: 96 },
  { name: 'Body Algodão', sold: 82 },
  { name: 'Conjunto Bem-te-vi', sold: 71 },
  { name: 'Suéter Tricô', sold: 58 },
  { name: 'Macacão Soft', sold: 44 },
]

export const salesByDay = [
  { day: 'Seg', vendas: 1240 },
  { day: 'Ter', vendas: 1890 },
  { day: 'Qua', vendas: 1520 },
  { day: 'Qui', vendas: 2180 },
  { day: 'Sex', vendas: 2640 },
  { day: 'Sáb', vendas: 3120 },
  { day: 'Dom', vendas: 980 },
]

export const salesByMonth = [
  { month: 'Jan', faturamento: 28400 },
  { month: 'Fev', faturamento: 31200 },
  { month: 'Mar', faturamento: 29800 },
  { month: 'Abr', faturamento: 35600 },
  { month: 'Mai', faturamento: 38900 },
  { month: 'Jun', faturamento: 42350 },
]

export const salesByCategory = [
  { category: 'Meninas', value: 38 },
  { category: 'Meninos', value: 29 },
  { category: 'Recém-nascido', value: 18 },
  { category: 'Unissex', value: 15 },
]

export const newCustomersByMonth = [
  { month: 'Jan', novos: 42 },
  { month: 'Fev', novos: 58 },
  { month: 'Mar', novos: 49 },
  { month: 'Abr', novos: 71 },
  { month: 'Mai', novos: 83 },
  { month: 'Jun', novos: 96 },
]

export const statusLabels: Record<
  AdminOrderStatus,
  { label: string; className: string }
> = {
  pendente: { label: 'Pendente', className: 'bg-accent/25 text-accent-foreground' },
  pago: { label: 'Pago', className: 'bg-primary/15 text-primary' },
  enviado: { label: 'Enviado', className: 'bg-chart-5/15 text-chart-5' },
  entregue: { label: 'Entregue', className: 'bg-whatsapp/15 text-whatsapp' },
  cancelado: { label: 'Cancelado', className: 'bg-secondary text-secondary-foreground' },
}

export const productStatusLabels: Record<
  ProductStatus,
  { label: string; className: string }
> = {
  ativo: { label: 'Ativo', className: 'bg-whatsapp/15 text-whatsapp' },
  inativo: { label: 'Inativo', className: 'bg-muted text-muted-foreground' },
  esgotado: { label: 'Esgotado', className: 'bg-secondary text-secondary-foreground' },
}

export const WHATSAPP_SUPPORT_URL = whatsappUrl(
  'Olá! Preciso de suporte com o painel Zig Zag Baby',
)
