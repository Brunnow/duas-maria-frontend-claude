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
export function validateCoupon(code, appliedCodes = []) {
  // appliedCodes: cupons já aplicados no checkout. O backend valida a
  // combinação (máx. 2, todos combináveis) e devolve `coupons` com a parte de
  // cada um e `totalDiscountAmount`.
  const body = appliedCodes.length > 0 ? { code, appliedCodes } : { code };
  return api.post('/coupons/validate', body).then((response) => response.data);
}
