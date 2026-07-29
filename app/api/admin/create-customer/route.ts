import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Cria um cliente manualmente (fluxo administrativo / WhatsApp).
 *
 * Como `public.profiles.id` referencia `auth.users(id)` e um trigger
 * (`handle_new_user`) cria o perfil automaticamente, todo cliente precisa
 * de um usuário de auth. Este endpoint usa a SERVICE ROLE (somente no
 * servidor) para criar o usuário e, em seguida, enriquece o perfil.
 *
 * Segurança: exige o token do administrador no header Authorization e
 * confirma que ele consta em `admin_profiles`.
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

  const fullName = String(body.fullName ?? '').trim()
  if (!fullName) {
    return NextResponse.json(
      { error: 'Informe o nome do cliente.' },
      { status: 400 },
    )
  }

  const phone = String(body.phone ?? '').trim() || null
  const providedEmail = String(body.email ?? '').trim().toLowerCase() || null
  const cpf = String(body.cpf ?? '').trim() || null
  const birthDate = String(body.birthDate ?? '').trim() || null
  const notes = String(body.notes ?? '').trim() || null
  const origin = String(body.origin ?? 'whatsapp').trim() || 'whatsapp'
  const address = body.address ?? null

  // E-mail sintético (não recebe e-mails) para clientes sem e-mail real.
  const authEmail =
    providedEmail ??
    `wpp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@clientes.zigzagbaby.local`

  // Senha aleatória forte (o cliente pode redefinir depois, se tiver e-mail).
  const password = `Zz!${crypto.randomUUID()}`

  // 4) Cria o usuário de auth (o trigger cria o profile)
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone },
    })

  if (createError || !created?.user) {
    const msg = (createError?.message ?? '').toLowerCase()
    if (msg.includes('already') || msg.includes('registered')) {
      return NextResponse.json(
        { error: 'Já existe um cliente com este e-mail.' },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { error: 'Não foi possível criar o cliente.' },
      { status: 400 },
    )
  }

  const newId = created.user.id

  // 5) Enriquece o perfil criado pelo trigger
  const { error: profileError } = await admin
    .from('profiles')
    .update({
      full_name: fullName,
      phone,
      email: providedEmail, // null quando não informado (não expõe e-mail sintético)
      cpf,
      birth_date: birthDate,
      notes,
      origin,
    })
    .eq('id', newId)

  if (profileError) {
    // Perfil existe, mas não foi possível completar os dados extras.
    return NextResponse.json(
      { id: newId, warning: 'Cliente criado, mas alguns dados não foram salvos.' },
      { status: 200 },
    )
  }

  // 6) Endereço opcional
  if (address && String(address.street ?? '').trim()) {
    await admin.from('addresses').insert({
      profile_id: newId,
      label: 'Principal',
      street: String(address.street).trim(),
      number: String(address.number ?? '').trim() || null,
      complement: String(address.complement ?? '').trim() || null,
      neighborhood: String(address.neighborhood ?? '').trim() || null,
      city: String(address.city ?? '').trim() || '-',
      state: String(address.state ?? '').trim() || '-',
      zip_code: String(address.zipCode ?? '').trim() || '-',
      is_default: true,
    })
  }

  // 7) Crianças vinculadas (opcional): nome, sexo e data de nascimento
  const allowedSex = ['menino', 'menina', 'nao-informar']
  const children = Array.isArray(body.children) ? body.children : []
  const childRows = children
    .map((c: any) => ({
      profile_id: newId,
      child_name: String(c?.name ?? '').trim(),
      birth_date: String(c?.birthDate ?? '').trim() || null,
      sex: allowedSex.includes(String(c?.sex))
        ? String(c.sex)
        : 'nao-informar',
    }))
    .filter((c: any) => c.child_name)

  if (childRows.length > 0) {
    const { error: childrenError } = await admin
      .from('children_profiles')
      .insert(childRows)
    if (childrenError) {
      return NextResponse.json(
        {
          id: newId,
          warning: 'Cliente criado, mas as crianças não foram salvas.',
        },
        { status: 200 },
      )
    }
  }

  return NextResponse.json({ id: newId }, { status: 200 })
}
