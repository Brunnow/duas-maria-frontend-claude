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
