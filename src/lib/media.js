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

/** Maior lado (px) das cópias geradas pelo backend (ImageVariants.java). */
export const IMAGE_SIZES = { small: 800, large: 1600 };

// Mesma regra do backend: só originais enviados (nome UUID) em JPG/PNG têm cópias.
const ORIGINAL_RE =
  /^(.*\/)?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(jpe?g|png)$/i;

/**
 * URL da cópia menor de uma foto de produto (`<uuid>.jpg` → `<uuid>-800.jpg`),
 * ou `null` quando a foto não tem cópia (default.png, WEBP, GIF, URL externa).
 * Quem usa precisa cair no original se a cópia falhar — ver OptimizedImage.
 */
export function optimizedImageUrl(url, size = 'small') {
  const px = IMAGE_SIZES[size];
  if (!url || !px) return null;
  const match = ORIGINAL_RE.exec(String(url));
  if (!match) return null;
  return `${match[1] || ''}${match[2]}-${px}.jpg`;
}
