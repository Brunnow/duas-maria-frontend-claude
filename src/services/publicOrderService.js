import api from '@/api/api';

/*
 * "Meus pedidos" sem login (PublicOrderAccessController), sem auth:
 *
 *   POST /api/public/orders/lookup  { identifier }  -> 202 { message }
 *     E-mail ou CPF usado na compra. A resposta é sempre a mesma, encontrando
 *     ou não: o link vai por e-mail para quem fez a compra. 429 = muitas
 *     tentativas.
 *
 *   POST /api/public/orders/access  { token }  -> 200 { maskedEmail, orders: OrderDTO[] }
 *     Pedidos do link (sem CPF, telefone e número da casa). 404 = link
 *     inválido ou expirado. O token vai no corpo, não na URL da API.
 */
export function requestOrdersLink(identifier) {
  return api.post('/public/orders/lookup', { identifier }).then((response) => response.data);
}

export function fetchOrdersByAccessToken(token) {
  return api.post('/public/orders/access', { token }).then((response) => response.data);
}
