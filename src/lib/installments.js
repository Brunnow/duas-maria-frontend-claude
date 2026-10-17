/*
 * Parcelamento anunciado na vitrine. O "sem juros" é configurado na conta do
 * Mercado Pago (não na API da preferência) — se a loja mudar lá a quantidade
 * de parcelas sem juros, este número precisa acompanhar, senão o card promete
 * algo que o checkout não cumpre.
 */
export const INTEREST_FREE_INSTALLMENTS = 6;

/** Valor de cada parcela sem juros, ou null quando não há preço válido. */
export function installmentValue(amount, installments = INTEREST_FREE_INSTALLMENTS) {
  const number = Number(amount);
  if (!Number.isFinite(number) || number <= 0) return null;
  return Math.round((number * 100) / installments) / 100;
}
