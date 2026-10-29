/*
 * Card de lançamento do site (2026-10-18). Fica no código de propósito (versão
 * rápida para a noite do lançamento): para mudar os cupons ou a data, é aqui.
 * Some sozinho depois de LAUNCH_PROMO_ENDS_AT — não precisa de novo deploy.
 */
export const LAUNCH_PROMO_COUPONS = [
  { code: 'PRIMEIRACOMPRA', description: '10% off na primeira compra' },
  { code: 'ESQUENTA20', description: '20% off no esquenta de lançamento' },
];

/** Último instante em que o card aparece (horário de Brasília). */
export const LAUNCH_PROMO_ENDS_AT = new Date('2026-11-04T23:59:59-03:00');

/**
 * Tempo na MESMA página antes do card aparecer (trocar de página recomeça a
 * contagem): quem está olhando uma peça não é interrompido logo de cara.
 */
export const LAUNCH_PROMO_DELAY_MS = 15000;

/** Onde o card não aparece: no meio da compra e fora da loja. */
const HIDDEN_PREFIXES = ['/carrinho', '/checkout', '/login', '/cadastro', '/admin'];

export function launchPromoHiddenOn(pathname) {
  return HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function launchPromoActive(now = new Date()) {
  return now <= LAUNCH_PROMO_ENDS_AT;
}
