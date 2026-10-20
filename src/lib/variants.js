/* Tamanhos de variante aceitos pelo backend (AppConstants.ALLOWED_VARIANT_SIZES),
 * na ordem de exibição: letras → numeração crescente → Único. */
export const LETTER_SIZES = ['PP', 'P', 'M', 'G', 'GG'];
/* Numeração (jeans, calças, shorts), incluindo plus size. */
export const NUMBER_SIZES = ['34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54'];
export const UNICO = 'Único';

export const VARIANT_SIZES = [...LETTER_SIZES, ...NUMBER_SIZES, UNICO];

/** Grupos para os formulários do admin (o "Único" nunca convive com os outros). */
export const SIZE_GROUPS = [
  { label: 'Letras', sizes: LETTER_SIZES },
  { label: 'Numeração', sizes: NUMBER_SIZES },
  { label: 'Sem grade', sizes: [UNICO] },
];

export function sizeRank(size) {
  const i = VARIANT_SIZES.indexOf(size);
  return i === -1 ? VARIANT_SIZES.length : i;
}

/** Converte o objeto { size: stockString } da grade para o corpo do POST de variantes. */
export function toGridPayload(value) {
  return Object.entries(value || {})
    .map(([size, stock]) => ({ size, initialStock: Number(stock) }))
    .filter((v) => Number.isInteger(v.initialStock) && v.initialStock >= 0)
    .sort((a, b) => sizeRank(a.size) - sizeRank(b.size));
}

/** "Verde · M"; só o tamanho sem cor; só a cor quando o tamanho é "Único" (espelha VariantLabels.java). */
export function variantLabel(color, size) {
  const c = (color || '').trim();
  if (!c) return size;
  if (!size || size === UNICO) return c;
  return `${c} · ${size}`;
}

const colorKey = (color) => (color || '').trim().toLowerCase();

/** O produto tem variação por cor? (no backend é tudo ou nada) */
export function hasColors(variants) {
  return (variants || []).some((v) => (v.color || '').trim() !== '');
}

/**
 * Agrupa variações por cor, na ordem em que as cores foram criadas (menor variantId), e os
 * tamanhos de cada cor na ordem de exibição. Produto sem cor = um grupo com color ''.
 * -> [{ color, colorHex, variants: [...] }]
 */
export function groupByColor(variants) {
  const groups = new Map();
  [...(variants || [])]
    .sort((a, b) => (a.variantId ?? 0) - (b.variantId ?? 0))
    .forEach((v) => {
      const key = colorKey(v.color);
      if (!groups.has(key))
        groups.set(key, { color: v.color || '', colorHex: v.colorHex || null, variants: [] });
      groups.get(key).variants.push(v);
    });
  return [...groups.values()].map((g) => ({
    ...g,
    variants: g.variants.sort((a, b) => sizeRank(a.size) - sizeRank(b.size)),
  }));
}

export function sameColor(a, b) {
  return colorKey(a) === colorKey(b);
}
