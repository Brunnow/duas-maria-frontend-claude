import api from '@/api/api';

/*
 * Carrinho por variacao. A regra de negocio (estoque, totais, dedupe) vive
 * no backend (ver CLAUDE.md) — aqui e so a chamada HTTP.
 *
 *   GET    /api/carts/users/cart                                              -> CartDTO
 *   POST   /api/carts/products/{productId}/variants/{variantId}/quantity/{q}  -> CartDTO (201)
 *   PUT    /api/cart/variants/{variantId}/quantity/{operation}                -> CartDTO
 *          operation "delete" => -1 ; qualquer outro valor => +1
 *   DELETE /api/carts/{cartId}/variants/{variantId}                           -> string
 *
 * Todos exigem autenticacao (cookie JWT).
 */

export function getCart() {
  return api.get('/carts/users/cart').then((response) => response.data);
}

export function addVariantToCart(productId, variantId, quantity) {
  return api
    .post(`/carts/products/${productId}/variants/${variantId}/quantity/${quantity}`)
    .then((response) => response.data);
}

export function incrementVariant(variantId) {
  return api.put(`/cart/variants/${variantId}/quantity/add`).then((response) => response.data);
}

export function decrementVariant(variantId) {
  return api.put(`/cart/variants/${variantId}/quantity/delete`).then((response) => response.data);
}

/** O DELETE devolve uma string; quem chama deve recarregar o carrinho. */
export function removeVariant(cartId, variantId) {
  return api.delete(`/carts/${cartId}/variants/${variantId}`).then((response) => response.data);
}
