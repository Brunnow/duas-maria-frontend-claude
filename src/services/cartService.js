import api from '@/api/api';

/*
 * Carrinho por variação. A regra de negócio do carrinho vive no backend
 * (ver CLAUDE.md) — aqui é só a chamada.
 *
 *   POST /api/carts/products/{productId}/variants/{variantId}/quantity/{quantity} -> CartDTO
 *
 * Requer autenticação (cookie JWT). Enquanto a fase de Autenticação não
 * existe, esta chamada responde 401 e a UI trata isso como "faça login".
 */

export function addVariantToCart(productId, variantId, quantity) {
  return api
    .post(`/carts/products/${productId}/variants/${variantId}/quantity/${quantity}`)
    .then((response) => response.data);
}
