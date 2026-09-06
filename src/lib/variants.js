/* Tamanhos de variante aceitos pelo backend (AppConstants.ALLOWED_VARIANT_SIZES),
 * na ordem de exibição PP → P → M → G → GG → Único. */
export const VARIANT_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'Único'];

export function sizeRank(size) {
  const i = VARIANT_SIZES.indexOf(size);
  return i === -1 ? VARIANT_SIZES.length : i;
}

/** Converte o objeto { size: stockString } da grade para o corpo do POST de variantes. */
export function toGridPayload(value) {
  return Object.entries(value || {})
    .map(([size, stock]) => ({ size, initialStock: Number(stock) }))
    .filter((v) => Number.isInteger(v.initialStock) && v.initialStock >= 0);
}
