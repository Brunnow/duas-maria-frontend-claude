import api from '@/api/api';
import { metaCookies } from '@/lib/pixel';

/*
 * Checkout sem cadastro (GuestCheckoutController), sem auth. Os itens vão
 * sem preço — o backend recalcula preço, estoque, frete e cupons:
 *
 *   POST /api/public/checkout/shipping-options  { cep, uf, items }
 *     -> 200 ShippingOptionDTO[]
 *   POST /api/public/checkout/coupons/validate  { code, appliedCodes?, email, document, items }
 *     -> 200 CouponPreviewDTO | 400 inválido | 409 já usado com este e-mail ou CPF
 *   POST /api/public/checkout/orders  GuestOrderRequest
 *     -> 201 { order, initPoint, paymentInitFailed, accessToken }
 *   POST /api/public/checkout/orders/{id}/payment  { token }
 *     -> 200 { preferenceId, initPoint }
 *
 * 429 = muitas tentativas a partir deste IP.
 */
const toItems = (items) =>
  items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
  }));

export function getGuestShippingOptions({ cep, uf, items }) {
  return api
    .post('/public/checkout/shipping-options', { cep, uf, items: toItems(items) })
    .then((response) => response.data);
}

export function validateGuestCoupon(code, appliedCodes, { email, document, items }) {
  const body = { code, email, document, items: toItems(items) };
  if (appliedCodes.length > 0) body.appliedCodes = appliedCodes;
  return api.post('/public/checkout/coupons/validate', body).then((response) => response.data);
}

/** `address` no formato do AddressForm (recipientName, phone, document, pincode, ...). */
export function createGuestOrder({
  email,
  address,
  items,
  couponCodes = [],
  shippingServiceId,
  idempotencyKey,
  website = '',
}) {
  const body = {
    email,
    address,
    items: toItems(items),
    paymentMethod: 'mercadopago',
    couponCodes: couponCodes.length > 0 ? couponCodes : undefined,
    shippingServiceId: shippingServiceId ?? undefined,
    idempotencyKey,
    website,
    ...metaCookies(),
  };
  return api.post('/public/checkout/orders', body).then((response) => response.data);
}

/*
 * "Checkout iniciado": nome, e-mail e WhatsApp (+ carrinho) assim que a pessoa
 * preenche, para o admin ver quem desistiu. Mesmo leadKey = mesma linha.
 *   POST /api/public/checkout/leads -> 204
 */
export function recordCheckoutLead({ leadKey, name, email, phone, items, website = '' }) {
  return api.post('/public/checkout/leads', {
    leadKey,
    name,
    email,
    phone,
    items: toItems(items),
    website,
  });
}

export function startGuestPayment(orderId, token) {
  return api
    .post(`/public/checkout/orders/${encodeURIComponent(orderId)}/payment`, { token })
    .then((response) => response.data);
}
