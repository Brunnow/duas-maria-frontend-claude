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
