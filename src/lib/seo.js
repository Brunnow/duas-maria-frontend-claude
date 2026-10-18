/** Textos padrão e utilitários de SEO (título/descrição no Google). */

export const SITE_NAME = 'Duas Maria';
export const DEFAULT_TITLE = 'Duas Maria | Moda feminina';
export const DEFAULT_DESCRIPTION =
  'Duas Maria — moda feminina com curadoria. Peças atemporais e de qualidade, com entrega para todo o Brasil e parcelamento em até 6x sem juros.';

const MAX_DESCRIPTION = 160;

/** Origem canônica: sem "www", para o Google não ver o site em dobro. */
export function siteOrigin() {
  return window.location.origin.replace('://www.', '://');
}

/** Texto livre (ex.: descrição do produto) cortado no tamanho que o Google mostra. */
export function toMetaDescription(text) {
  const clean = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= MAX_DESCRIPTION) return clean;
  return `${clean.slice(0, MAX_DESCRIPTION - 1).replace(/\s+\S*$/, '')}…`;
}
