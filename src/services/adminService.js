import api from '@/api/api';

/*
 * Painel administrativo. Contratos reais (exigem ROLE_ADMIN, exceto onde
 * anotado). Sem regra de negocio no front.
 */

// ---------- Produtos ----------

/** Lista paginada (reusa o endpoint publico — nao ha listagem admin). */
export function listProducts(params = {}) {
  return api
    .get('/public/products', { params: { pageSize: 60, ...params } })
    .then((response) => response.data);
}

/** POST /api/admin/categories/{categoryId}/product -> 201 ProductDTO */
export function createProduct(categoryId, product) {
  return api
    .post(`/admin/categories/${categoryId}/product`, product)
    .then((response) => response.data);
}

/** PUT /api/admin/products/{productId} -> 200 ProductDTO */
export function updateProduct(productId, product) {
  return api.put(`/admin/products/${productId}`, product).then((response) => response.data);
}

/** DELETE /api/admin/products/{productId} */
export function deleteProduct(productId) {
  return api.delete(`/admin/products/${productId}`).then((response) => response.data);
}

/** PUT /api/products/{productId}/image (multipart; substitui a imagem principal) */
export function uploadProductImage(productId, file) {
  const form = new FormData();
  form.append('image', file);
  return api.put(`/products/${productId}/image`, form).then((response) => response.data);
}

// ---------- Galeria de imagens (ROLE_ADMIN) ----------
// Todos devolvem a lista final ProductImageDTO[] = [{ imageId, url, alt, primary, position }].

/** GET /api/admin/products/{id}/images */
export function listProductImages(productId) {
  return api.get(`/admin/products/${productId}/images`).then((response) => response.data);
}

/** POST /api/admin/products/{id}/images (multipart "images", N arquivos, máx. 8/produto) */
export function uploadProductImages(productId, files) {
  const form = new FormData();
  Array.from(files).forEach((file) => form.append('images', file));
  return api.post(`/admin/products/${productId}/images`, form).then((response) => response.data);
}

/** DELETE /api/admin/products/{id}/images/{imageId} */
export function deleteProductImage(productId, imageId) {
  return api
    .delete(`/admin/products/${productId}/images/${imageId}`)
    .then((response) => response.data);
}

/** PUT /api/admin/products/{id}/images/{imageId}/primary */
export function setPrimaryProductImage(productId, imageId) {
  return api
    .put(`/admin/products/${productId}/images/${imageId}/primary`)
    .then((response) => response.data);
}

/** PUT /api/admin/products/{id}/images/order { imageIds: [...] } */
export function reorderProductImages(productId, imageIds) {
  return api
    .put(`/admin/products/${productId}/images/order`, { imageIds })
    .then((response) => response.data);
}

// ---------- Categorias ----------

/** POST /api/public/categories { categoryName } (nome >= 5 chars) */
export function createCategory(categoryName) {
  return api.post('/public/categories', { categoryName }).then((response) => response.data);
}

/** PUT /api/public/categories/{categoryId} { categoryName } */
export function updateCategory(categoryId, categoryName) {
  return api
    .put(`/public/categories/${categoryId}`, { categoryName })
    .then((response) => response.data);
}

/** DELETE /api/admin/categories/{categoryId} */
export function deleteCategory(categoryId) {
  return api.delete(`/admin/categories/${categoryId}`).then((response) => response.data);
}

// ---------- Variantes / Estoque ----------

/** GET /api/admin/products/{productId}/variants -> ProductVariantDTO[] */
export function getVariants(productId) {
  return api.get(`/admin/products/${productId}/variants`).then((response) => response.data);
}

/**
 * POST /api/admin/products/{productId}/variants { variants: [{ size, initialStock }] }
 * size ∈ PP, P, M, G, GG, Único.
 */
export function createVariants(productId, variants) {
  return api
    .post(`/admin/products/${productId}/variants`, { variants })
    .then((response) => response.data);
}

/** DELETE /api/admin/products/{productId}/variants/{variantId} (estoque deve ser 0) */
export function deleteVariant(productId, variantId) {
  return api
    .delete(`/admin/products/${productId}/variants/${variantId}`)
    .then((response) => response.data);
}

/** PATCH .../variants/{variantId}/stock { newQuantity, note } -> StockMovementDTO (RECOUNT) */
export function recountStock(productId, variantId, newQuantity, note) {
  return api
    .patch(`/admin/products/${productId}/variants/${variantId}/stock`, { newQuantity, note })
    .then((response) => response.data);
}

/**
 * POST .../variants/{variantId}/stock-movements { type, quantity, note }
 * type ∈ LOSS, RETURN, ADJUSTMENT, SALE_STORE (quantity > 0; o backend aplica o sinal).
 */
export function registerMovement(productId, variantId, body) {
  return api
    .post(`/admin/products/${productId}/variants/${variantId}/stock-movements`, body)
    .then((response) => response.data);
}

/** GET /api/admin/stock/low?threshold= -> ProductVariantDTO[] */
export function getLowStock(threshold = 3) {
  return api.get('/admin/stock/low', { params: { threshold } }).then((response) => response.data);
}

// ---------- Pedidos ----------

/**
 * GET /api/admin/orders/stuck-payments-count -> { count }
 * Quantos pagamentos têm uma falha de reconciliação registrada agora (achado
 * do teste manual de 2026-09-27: o webhook do Mercado Pago pode falhar sem
 * avisar ninguém — não conta pedidos simplesmente aguardando o cliente pagar
 * um boleto/Pix, só os casos em que a reconciliação automática tentou e não
 * conseguiu).
 */
export function getStuckPaymentsCount() {
  return api.get('/admin/orders/stuck-payments-count').then((response) => response.data.count);
}
