/*
 * Regras de troca e devolução da loja (decisão da dona, 2026-10-16). A página
 * /trocas-e-devolucoes e os avisos da página de produto leem daqui; o registro
 * de troca/devolução no admin deve aplicar as mesmas regras no backend.
 */

export const RETURN_POLICY_PATH = '/trocas-e-devolucoes';

/** Prazo, em dias corridos a partir do recebimento, para troca e para devolução. */
export const RETURN_WINDOW_DAYS = 7;

/** Mesmo critério do <Price>: preço promocional válido e menor que o cheio. */
export function isOnSale(price, specialPrice) {
  return specialPrice != null && Number(specialPrice) > 0 && Number(specialPrice) < Number(price);
}
