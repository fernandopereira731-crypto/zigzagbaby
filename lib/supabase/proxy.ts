import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Atualiza (refresh) a sessão do Supabase a cada requisição, mantendo os
 * cookies de autenticação sincronizados entre browser e servidor.
 *
 * OBS: por enquanto NÃO há redirecionamento forçado de rotas protegidas. O
 * painel administrativo continua em modo demonstração até a autenticação real
 * ser validada. Quando quisermos proteger rotas no nível do middleware,
 * adicionamos a checagem de `user` aqui.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Com Fluid compute, nunca colocar este client em variável global.
  // Sempre criar um novo a cada requisição.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Não rodar código entre createServerClient e supabase.auth.getUser().
  // Isso mantém a sessão consistente e evita logout aleatório.
  await supabase.auth.getUser()

  // IMPORTANTE: retornar o supabaseResponse como está para não dessincronizar
  // os cookies entre browser e servidor.
  return supabaseResponse
}
