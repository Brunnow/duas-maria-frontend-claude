import api from '@/api/api';

/*
 * Configurações da loja (linha única no backend).
 *
 *   GET /api/public/store-settings -> 200 { freeShippingMinAmount, announcementEnabled,
 *                                          announcementText, announcementCouponCode }
 *   GET /api/admin/store-settings  -> 200 (mesmo formato, inclui rascunho da tarja desligada)
 *   PUT /api/admin/store-settings { freeShippingMinAmount } -> só o frete grátis
 *   PUT /api/admin/store-settings/announcement { enabled, text, couponCode } -> só a tarja
 *
 * freeShippingMinAmount null = frete grátis desativado.
 */

// A tarja e o carrinho leem a mesma configuração pública: uma requisição por
// carregamento de página basta. Falha não fica em cache.
let publicCache = null;

export function getPublicStoreSettings() {
  if (!publicCache) {
    publicCache = api
      .get('/public/store-settings')
      .then((response) => response.data)
      .catch((error) => {
        publicCache = null;
        throw error;
      });
  }
  return publicCache;
}

export function invalidatePublicStoreSettings() {
  publicCache = null;
}

export function getStoreSettings() {
  return api.get('/admin/store-settings').then((response) => response.data);
}

export function saveStoreSettings(settings) {
  return api.put('/admin/store-settings', settings).then((response) => {
    invalidatePublicStoreSettings();
    return response.data;
  });
}

export function saveAnnouncementBar(bar) {
  return api.put('/admin/store-settings/announcement', bar).then((response) => {
    invalidatePublicStoreSettings();
    return response.data;
  });
}
