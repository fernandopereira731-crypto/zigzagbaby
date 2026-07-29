'use client'

import { getSupabaseBrowserClient } from './auth/supabase-client'

/**
 * Camada de acesso a dados das categorias (painel admin).
 * Usa a sessão do admin autenticado; as políticas RLS (is_admin) garantem
 * que apenas administradores possam escrever.
 */

export type AdminCategoryRow = {
  id: string
  name: string
  slug: string
  description: string | null
  sortOrder: number
  isActive: boolean
  productCount: number
}

export type CategoryInput = {
  name: string
  description?: string | null
}

function client() {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) throw new Error('Supabase não está conectado.')
  return supabase
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return base || 'categoria'
}

/** Lista as categorias (todas, ativas e inativas) com a contagem real de produtos. */
export async function listCategories(): Promise<AdminCategoryRow[]> {
  const supabase = client()
  const [catsRes, prodRes] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug, description, sort_order, is_active')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase.from('products').select('category_id'),
  ])

  if (catsRes.error) throw new Error(catsRes.error.message)
  if (prodRes.error) throw new Error(prodRes.error.message)

  const counts = new Map<string, number>()
  for (const p of (prodRes.data ?? []) as { category_id: string | null }[]) {
    if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1)
  }

  return (catsRes.data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    sortOrder: c.sort_order ?? 0,
    isActive: c.is_active ?? true,
    productCount: counts.get(c.id) ?? 0,
  }))
}

/** Cria uma nova categoria no final da ordenação. */
export async function createCategory(input: CategoryInput): Promise<void> {
  const supabase = client()
  const name = input.name.trim()
  if (!name) throw new Error('Informe o nome da categoria.')

  // Próxima posição de ordenação.
  const { data: last } = await supabase
    .from('categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextOrder = ((last?.sort_order as number | undefined) ?? 0) + 1

  // Garante slug único.
  let slug = slugify(name)
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`

  const { error } = await supabase.from('categories').insert({
    name,
    slug,
    description: input.description?.trim() || null,
    sort_order: nextOrder,
    is_active: true,
  })
  if (error) throw new Error(error.message)
}

/** Atualiza nome/descrição de uma categoria. */
export async function updateCategory(
  id: string,
  input: CategoryInput,
): Promise<void> {
  const supabase = client()
  const name = input.name.trim()
  if (!name) throw new Error('Informe o nome da categoria.')
  const { error } = await supabase
    .from('categories')
    .update({ name, description: input.description?.trim() || null })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

/** Ativa/desativa uma categoria. */
export async function toggleCategory(
  id: string,
  isActive: boolean,
): Promise<void> {
  const supabase = client()
  const { error } = await supabase
    .from('categories')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

/** Exclui uma categoria. Bloqueia se houver produtos vinculados. */
export async function deleteCategory(id: string): Promise<void> {
  const supabase = client()
  const { count, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)
  if (countError) throw new Error(countError.message)
  if ((count ?? 0) > 0) {
    throw new Error(
      'Não é possível excluir: há produtos vinculados a esta categoria.',
    )
  }
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/** Troca a posição de ordenação entre duas categorias. */
export async function swapCategoryOrder(
  a: { id: string; sortOrder: number },
  b: { id: string; sortOrder: number },
): Promise<void> {
  const supabase = client()
  const [r1, r2] = await Promise.all([
    supabase.from('categories').update({ sort_order: b.sortOrder }).eq('id', a.id),
    supabase.from('categories').update({ sort_order: a.sortOrder }).eq('id', b.id),
  ])
  if (r1.error) throw new Error(r1.error.message)
  if (r2.error) throw new Error(r2.error.message)
}
