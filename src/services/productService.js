import api from '@/api/api';

/*
 * Acesso à API pública de produtos. Nenhuma URL de API fora daqui.
 * Contratos (backend Spring, pacote com.ecommerce.duas_marias):
 *   GET /api/public/products/{id}          -> ProductDTO
 *   GET /api/public/products/{id}/variants -> PublicProductVariantDTO[]
 * Produto inexistente responde 404 { message, status:false }.
 */

export function getProduct(productId) {
  return api.get(`/public/products/${productId}`).then((response) => response.data);
}

export function getProductVariants(productId) {
  return api.get(`/public/products/${productId}/variants`).then((response) => response.data);
}
