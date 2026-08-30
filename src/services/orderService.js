import api from '@/api/api';

/*
 * Checkout. Contrato real (OrderController), exige auth:
 *   POST /api/order/users/payments/{paymentMethod}
 *   body OrderRequestDTO { addressId, paymentMethod, pgName, pgPaymentId, pgStatus, pgResponseMessage }
 *   -> 201 OrderDTO
 *
 * O backend revalida o estoque, baixa o estoque e ESVAZIA o carrinho.
 * Erros: 409 OutOfStockResponse { message, unavailableItems[] },
 *        400 "Cart is empty", 404 Address.
 *
 * Os campos pg* sao do gateway de pagamento — aqui vao valores simulados
 * (nao ha cobranca real nesta fase).
 */
export function placeOrder({ addressId, paymentMethod }) {
  const body = {
    addressId,
    paymentMethod,
    pgName: 'mock',
    pgPaymentId: `mock-${Date.now()}`,
    pgStatus: 'APPROVED',
    pgResponseMessage: 'Pagamento simulado',
  };

  return api
    .post(`/order/users/payments/${encodeURIComponent(paymentMethod)}`, body)
    .then((response) => response.data);
}
