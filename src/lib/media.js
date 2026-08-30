const BASE = import.meta.env.VITE_BACK_END_URL || '';

/**
 * Resolve a URL de uma imagem de produto.
 *
 * Alguns endpoints retornam a URL completa (lista e detalhe de produto);
 * outros retornam so o nome do arquivo (itens do carrinho). Este helper
 * prefixa `VITE_BACK_END_URL/images/` quando necessario e deixa URLs
 * absolutas intactas.
 */
export function productImageUrl(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const name = String(value).replace(/^\/?(images\/)?/i, '');
  return `${BASE}/images/${name}`;
}
