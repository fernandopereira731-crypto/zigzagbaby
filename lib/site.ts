// Configuração central da loja — fonte única de verdade para contato e redes sociais.
// Alterar apenas aqui atualiza todos os links de WhatsApp da loja.
// Número oficial Zig Zag Baby: (38) 99841-8629
export const WHATSAPP_NUMBER = '5538998418629'

/** Monta um link de WhatsApp com mensagem pré-preenchida. */
export function whatsappUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

export const INSTAGRAM_URL = 'https://instagram.com/zigzagbaby'
export const FACEBOOK_URL = 'https://facebook.com/zigzagbaby'
