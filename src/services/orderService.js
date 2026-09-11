import api from '@/api/api';

/*
 * Checkout com Mercado Pago (Fase D), exige auth:
 *   POST /api/orders
 *   body CreateOrderRequest { addressId, paymentMethod, couponCode? }
 *   -> 201 CreateOrderResponse { order: OrderDTO, initPoint, paymentInitFailed }
 *
 * Cria o pedido AGUARDANDO_PAGAMENTO (sem tocar estoque/carrinho — só o
 * webhook confirma) e já tenta abrir a preference do Checkout Pro. Se o MP
 * falhar na hora (`paymentInitFailed: true`), o pedido fica salvo mesmo assim
 * e o cliente pode tentar de novo com startMercadoPagoPayment.
 * Erros: 409 OutOfStockResponse { message, unavailableItems[] },
 *        400 "Cart is empty" / cupom inválido, 404 Address, 409 limite do cupom.
 * O cupom é só o código: o backend valida e calcula o desconto (nunca confia
 * num valor vindo daqui).
 */
export function createOrder({ addressId, paymentMethod = 'mercadopago', couponCode }) {
  const body = { addressId, paymentMethod, couponCode: couponCode || undefined };
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
 * Checkout mock legado (Fases 0–C) — nenhuma cobrança real. Mantido só como
 * referência/fallback de desenvolvimento; a tela de checkout não usa mais
 * esta função (ver createOrder). Contrato: POST /api/order/users/payments/{paymentMethod}.
 */
export function placeOrderMock({ addressId, paymentMethod, couponCode }) {
  const body = {
    addressId,
    paymentMethod,
    pgName: 'mock',
    pgPaymentId: `mock-${Date.now()}`,
    pgStatus: 'APPROVED',
    pgResponseMessage: 'Pagamento simulado',
    couponCode: couponCode || undefined,
  };

  return api
    .post(`/order/users/payments/${encodeURIComponent(paymentMethod)}`, body)
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
