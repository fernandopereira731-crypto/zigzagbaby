import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Exclui um cliente permanentemente (fluxo administrativo).
 *
 * Como `public.profiles.id` referencia `auth.users(id)`, apagamos o usuário
 * de auth com a SERVICE ROLE. As tabelas dependentes (profiles, children_profiles,
 * addresses, favoritos) são removidas em cascata. Os pedidos são preservados
 * (o `profile_id` passa a nulo via ON DELETE SET NULL), mantendo o histórico
 * de vendas.
 *
 * Segurança: exige o token do administrador no header Authorization e
 * confirma que ele consta em `admin_profiles`. Impede que o admin exclua
 * a si mesmo ou outro administrador.
 */
export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: 'Servidor sem credenciais do Supabase.' },
      { status: 500 },
    )
  }

  // 1) Token do administrador
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : ''
  if (!token) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // 2) Verifica identidade e permissão de admin
  const {
    data: { user: caller },
    error: userError,
  } = await admin.auth.getUser(token)
  if (userError || !caller) {
    return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 })
  }

  const { data: adminRow } = await admin
    .from('admin_profiles')
    .select('id')
    .eq('id', caller.id)
    .maybeSingle()
  if (!adminRow) {
    return NextResponse.json(
      { error: 'Acesso restrito a administradores.' },
      { status: 403 },
    )
  }

  // 3) Payload
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido.' }, { status: 400 })
  }

  const customerId = String(body.customerId ?? '').trim()
  if (!customerId) {
    return NextResponse.json(
      { error: 'Cliente não informado.' },
      { status: 400 },
    )
  }

  // 4) Proteções: não excluir a si mesmo nem outro administrador
  if (customerId === caller.id) {
    return NextResponse.json(
      { error: 'Você não pode excluir a própria conta.' },
      { status: 400 },
    )
  }

  const { data: targetIsAdmin } = await admin
    .from('admin_profiles')
    .select('id')
    .eq('id', customerId)
    .maybeSingle()
  if (targetIsAdmin) {
    return NextResponse.json(
      { error: 'Não é possível excluir uma conta de administrador.' },
      { status: 400 },
    )
  }

  // 5) Exclui o usuário de auth (cascata remove perfil, crianças, endereços...)
  const { error: deleteError } = await admin.auth.admin.deleteUser(customerId)
  if (deleteError) {
    return NextResponse.json(
      { error: 'Não foi possível excluir o cliente.' },
      { status: 400 },
    )
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
