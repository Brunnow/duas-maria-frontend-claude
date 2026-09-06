import api from '@/api/api';

/*
 * Checkout. Contrato real (OrderController), exige auth:
 *   POST /api/order/users/payments/{paymentMethod}
 *   body OrderRequestDTO { addressId, paymentMethod, pgName, pgPaymentId, pgStatus, pgResponseMessage, couponCode? }
 *   -> 201 OrderDTO
 *
 * O backend revalida o estoque, baixa o estoque e ESVAZIA o carrinho.
 * Erros: 409 OutOfStockResponse { message, unavailableItems[] },
 *        400 "Cart is empty" / cupom inválido, 404 Address, 409 limite do cupom.
 *
 * Os campos pg* sao do gateway de pagamento — aqui vao valores simulados
 * (nao ha cobranca real nesta fase). O cupom é só o codigo: o backend valida
 * e calcula o desconto (nunca confia num valor vindo daqui).
 */
export function placeOrder({ addressId, paymentMethod, couponCode }) {
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
