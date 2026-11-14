/** Contatos e redes da loja (rodapé, botão flutuante, política de trocas). */
export const STORE_WHATSAPP_URL = 'https://wa.me/5561995730440';
export const STORE_PHONE_DISPLAY = '(61) 99573-0440';
export const STORE_PHONE_TEL = 'tel:+5561995730440';
/** Mesma caixa do EMAIL_REPLY_TO do backend: onde chegam as respostas dos e-mails. */
export const STORE_EMAIL = 'atendimento.duasmaria@gmail.com';
export const STORE_INSTAGRAM_URL = 'https://www.instagram.com/duas.marias23/';
export const STORE_FACEBOOK_URL = 'https://www.facebook.com/share/18WAySHd8E/';

/** Link do WhatsApp para um número digitado pela cliente (DDD + número, Brasil). */
export function whatsappLink(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 10) return null;
  return `https://wa.me/55${digits.slice(-11)}`;
}
