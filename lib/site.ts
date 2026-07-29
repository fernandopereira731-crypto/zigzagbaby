// Configuração central da loja — fonte única de verdade para contato e redes sociais.
// TODO (produção): substituir pelos dados oficiais quando o banco de dados / configurações
// estiverem conectados. Alterar apenas aqui atualiza toda a loja.
export const WHATSAPP_NUMBER = '5500000000000'

/** Monta um link de WhatsApp com mensagem pré-preenchida. */
export function whatsappUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

export const INSTAGRAM_URL = 'https://instagram.com/zigzagbaby'
export const FACEBOOK_URL = 'https://facebook.com/zigzagbaby'
