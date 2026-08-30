export const PAGE_GAP = '…';

/**
 * Lista de paginas visiveis numa paginacao: sempre 1 e 2, a ultima e a
 * penultima, e a pagina atual com as vizinhas — com PAGE_GAP no lugar
 * dos trechos omitidos. Ate 7 paginas, lista todas.
 */
export function pageRange(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const wanted = [1, 2, total - 1, total, page - 1, page, page + 1];
  const shown = [...new Set(wanted)].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result = [];
  shown.forEach((p, i) => {
    if (i > 0 && p - shown[i - 1] > 1) result.push(PAGE_GAP);
    result.push(p);
  });
  return result;
}
