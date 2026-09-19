import api from '@/api/api';

/*
 * Checkout com Mercado Pago (Fase D), exige auth:
 *   POST /api/orders
 *   body CreateOrderRequest { addressId, paymentMethod, couponCode?, shippingServiceId? }
 *   -> 201 CreateOrderResponse { order: OrderDTO, initPoint, paymentInitFailed }
 *
 * Cria o pedido AGUARDANDO_PAGAMENTO (sem tocar estoque/carrinho — só o
 * webhook confirma) e já tenta abrir a preference do Checkout Pro. Se o MP
 * falhar na hora (`paymentInitFailed: true`), o pedido fica salvo mesmo assim
 * e o cliente pode tentar de novo com startMercadoPagoPayment.
 * Erros: 409 OutOfStockResponse { message, unavailableItems[] },
 *        400 "Cart is empty" / cupom inválido, 404 Address, 409 limite do cupom,
 *        400 "O frete escolhido não está mais disponível. Cote novamente."
 * O cupom é só o código e o frete é só o `serviceId` escolhido (Fase ME3): o
 * backend valida/recota tudo e nunca confia num valor vindo daqui.
 */
export function createOrder({
  addressId,
  paymentMethod = 'mercadopago',
  couponCode,
  shippingServiceId,
}) {
  const body = {
    addressId,
    paymentMethod,
    couponCode: couponCode || undefined,
    shippingServiceId: shippingServiceId ?? undefined,
  };
  return api.post('/orders', body).then((response) => response.data);
}

/*
 * Retry da preference do Checkout Pro para um pedido já criado (usado quando
 * a criação inicial falhou, ou para tentar de novo após um pagamento
 * recusado). 404 se o pedido não for do usuário, 409 se já estiver pago.
 *   POST /api/orders/{orderId}/payment/mercadopago -> { preferenceId, initPoint }
 */
export function startMercadoPagoPayment(orderId) {
  return api
    .post(`/orders/${encodeURIComponent(orderId)}/payment/mercadopago`)
    .then((response) => response.data);
}

/*
 * Histórico de pedidos (OrderController), exige auth:
 *   GET /api/orders            -> 200 OrderDTO[] (só do usuário logado, mais recente primeiro)
 *   GET /api/orders/{orderId}  -> 200 OrderDTO | 404 (não existe OU é de outro usuário)
 */
export function fetchOrders() {
  return api.get('/orders').then((response) => response.data);
}

export function fetchOrderById(orderId) {
  return api.get(`/orders/${encodeURIComponent(orderId)}`).then((response) => response.data);
}
