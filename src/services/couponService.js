import api from '@/api/api';

/*
 * Validação de cupom para o checkout (CouponController, exige auth):
 *   POST /api/coupons/validate  { code }
 *     -> 200 { code, discountType, discountValue, discountAmount, subtotal, subtotalAfterDiscount }
 *     -> 400 { message } cupom inválido / carrinho vazio
 *     -> 409 { message } limite de usos atingido
 *
 * O valor mostrado aqui é informativo; o backend recalcula o desconto na
 * criação do pedido (não confia neste número).
 */
export function validateCoupon(code) {
  return api.post('/coupons/validate', { code }).then((response) => response.data);
}
