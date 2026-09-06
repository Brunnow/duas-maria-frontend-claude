import api from '@/api/api';

/*
 * Cotação de frete (ShippingController, exige auth):
 *   POST /api/shipping/quote  { uf }
 *     -> 200 { shippingAmount, shippingMethod }   (shippingMethod: "FIXED_UF")
 *     -> 400 { uf: "UF inválida" }
 *
 * O valor mostrado aqui é informativo; o backend recalcula o frete pela
 * UF do endereço na hora de criar o pedido (não confia neste número).
 */
export function quoteShipping(uf) {
  return api.post('/shipping/quote', { uf }).then((response) => response.data);
}
