import api from '@/api/api';

/*
 * Painel administrativo — pedidos. Contratos reais (exigem ROLE_ADMIN;
 * /api/admin/** é protegido no backend). Sem regra de negócio no front:
 * a mudança de status é apenas solicitada, o backend valida a transição
 * e cuida de estoque/histórico.
 *
 *   GET   /api/admin/orders            -> 200 AdminOrderResponse (paginado)
 *   GET   /api/admin/orders/{id}       -> 200 AdminOrderDetailDTO | 404
 *   PATCH /api/admin/orders/{id}/status { status, note? }
 *         -> 200 AdminOrderDetailDTO | 400 status inválido | 404 | 409 transição
 *   POST  /api/admin/orders/{id}/refund
 *         -> 200 AdminOrderDetailDTO | 404 | 409 pagamento não está em REFUND_PENDING
 *   PATCH /api/admin/orders/{id}/tracking { trackingCode }
 *         -> 200 AdminOrderDetailDTO | 400 código vazio | 404
 *            | 409 pedido não pago, já entregue ou cancelado
 *         (Fase ME7-lite: a etiqueta é comprada manualmente no Melhor Envio,
 *         fora do sistema — aqui só se registra o código; o backend consulta
 *         o status na hora e continua consultando sozinho depois.)
 *   POST  /api/admin/orders/{id}/melhor-envio/purchase
 *         -> 200 AdminOrderDetailDTO | 404 | 409 pedido inelegível, dados
 *            faltando (CPF/remetente), ou falha do Melhor Envio (mensagem
 *            traz o motivo). Idempotente: chamar de novo depois de uma falha
 *            retoma do último passo concluído (Fase ME5/ME6).
 *   GET   /api/admin/orders/{id}/melhor-envio/print
 *         -> 200 { url } | 404 | 409 etiqueta ainda não gerada
 *         (busca o link ao vivo no Melhor Envio a cada chamada, não cacheia)
 */

/**
 * @param {{ status?, from?, to?, q?, pageNumber?, pageSize? }} params
 *   from/to no formato ISO (YYYY-MM-DD). Campos vazios são omitidos.
 */
export function listOrders(params = {}) {
  const query = {};
  ['status', 'from', 'to', 'q'].forEach((k) => {
    if (params[k]) query[k] = params[k];
  });
  if (params.pageNumber != null) query.pageNumber = params.pageNumber;
  if (params.pageSize != null) query.pageSize = params.pageSize;
  return api.get('/admin/orders', { params: query }).then((response) => response.data);
}

export function getOrder(orderId) {
  return api.get(`/admin/orders/${encodeURIComponent(orderId)}`).then((response) => response.data);
}

export function updateOrderStatus(orderId, { status, note }) {
  return api
    .patch(`/admin/orders/${encodeURIComponent(orderId)}/status`, { status, note })
    .then((response) => response.data);
}

export function retryRefund(orderId) {
  return api
    .post(`/admin/orders/${encodeURIComponent(orderId)}/refund`)
    .then((response) => response.data);
}

export function updateOrderTracking(orderId, trackingCode) {
  return api
    .patch(`/admin/orders/${encodeURIComponent(orderId)}/tracking`, { trackingCode })
    .then((response) => response.data);
}

export function purchaseShippingLabel(orderId) {
  return api
    .post(`/admin/orders/${encodeURIComponent(orderId)}/melhor-envio/purchase`)
    .then((response) => response.data);
}

export function getShippingLabelPrintUrl(orderId) {
  return api
    .get(`/admin/orders/${encodeURIComponent(orderId)}/melhor-envio/print`)
    .then((response) => response.data.url);
}
