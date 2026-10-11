import api from '@/api/api';

/*
 * Configurações da loja (linha única no backend).
 *
 *   GET /api/public/store-settings -> 200 { freeShippingMinAmount: number | null }
 *   GET /api/admin/store-settings  -> 200 { freeShippingMinAmount: number | null }
 *   PUT /api/admin/store-settings { freeShippingMinAmount } -> 200 | 400 validação
 *
 * freeShippingMinAmount null = frete grátis desativado.
 */

export function getPublicStoreSettings() {
  return api.get('/public/store-settings').then((response) => response.data);
}

export function getStoreSettings() {
  return api.get('/admin/store-settings').then((response) => response.data);
}

export function saveStoreSettings(settings) {
  return api.put('/admin/store-settings', settings).then((response) => response.data);
}
