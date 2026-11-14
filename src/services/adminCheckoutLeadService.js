import api from '@/api/api';

/*
 * "Checkouts não finalizados" (AdminCheckoutLeadController, ROLE_ADMIN):
 *   GET /api/admin/checkout-leads?onlyOpen=true&pageNumber=0&pageSize=20
 *     -> 200 { content: CheckoutLeadDTO[], pageNumber, pageSize, totalElements, totalPages, lastPage }
 *   CheckoutLeadDTO { id, name, email, phone, itemsSummary, subtotal, orderId, orderStatus,
 *                     createdAt, updatedAt }
 * onlyOpen=true = só quem não chegou a criar pedido.
 */
export function listCheckoutLeads({ onlyOpen = true, pageNumber = 0, pageSize = 20 } = {}) {
  return api
    .get('/admin/checkout-leads', { params: { onlyOpen, pageNumber, pageSize } })
    .then((response) => response.data);
}
