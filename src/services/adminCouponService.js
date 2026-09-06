import api from '@/api/api';

/*
 * CRUD de cupons (AdminCouponController, exige ROLE_ADMIN):
 *   GET    /api/admin/coupons        -> 200 CouponDTO[]
 *   POST   /api/admin/coupons        -> 201 CouponDTO
 *   PUT    /api/admin/coupons/{id}   -> 200 CouponDTO
 *   DELETE /api/admin/coupons/{id}   -> 204 | 409 (cupom já usado -> desative)
 *
 * body (POST/PUT): { code, description?, discountType: 'PERCENT'|'FIXED',
 *   discountValue, minOrderAmount?, startsAt?, endsAt?, maxRedemptions?,
 *   maxRedemptionsPerUser?, active? }
 */
export function listCoupons() {
  return api.get('/admin/coupons').then((response) => response.data);
}

export function createCoupon(body) {
  return api.post('/admin/coupons', body).then((response) => response.data);
}

export function updateCoupon(id, body) {
  return api
    .put(`/admin/coupons/${encodeURIComponent(id)}`, body)
    .then((response) => response.data);
}

export function deleteCoupon(id) {
  return api.delete(`/admin/coupons/${encodeURIComponent(id)}`).then((response) => response.data);
}
