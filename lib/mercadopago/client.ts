import 'server-only'

import { MercadoPagoConfig } from 'mercadopago'

/**
 * Configuração do SDK do Mercado Pago para uso EXCLUSIVO no servidor.
 *
 * O Access Token é uma credencial secreta e nunca deve ir para o cliente.
 * Por isso este módulo importa `server-only`: qualquer tentativa de
 * importá-lo em um componente client quebra o build, protegendo o token.
 *
 * A Public Key (NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) NÃO é usada aqui — ela
 * é destinada apenas ao front (SDK JS / bricks), quando necessário.
 */
export function getMercadoPagoConfig(): MercadoPagoConfig {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error(
      'MERCADO_PAGO_ACCESS_TOKEN não configurado no ambiente do servidor.',
    )
  }

  return new MercadoPagoConfig({
    accessToken,
    options: { timeout: 8000 },
  })
}
