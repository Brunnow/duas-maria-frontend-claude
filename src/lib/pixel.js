/*
 * Pixel da Meta (Facebook/Instagram Ads).
 *
 * - O ID vem de VITE_META_PIXEL_ID; vazio = tudo vira no-op silencioso.
 * - Em dev (npm run dev) e nos testes nada é disparado, para não sujar os
 *   dados — a não ser com VITE_META_PIXEL_DEBUG=true no .env.local (para
 *   testar com a extensão Meta Pixel Helper).
 * - initPixel NÃO dispara PageView: quem dispara é o usePixelPageView, a cada
 *   troca de página da SPA (inclusive a primeira).
 * - content_ids sempre com o id numérico do produto em texto (ex.: "511"), o
 *   mesmo do catálogo da Meta — senão o anúncio de catálogo não casa.
 */

const PIXEL_ID = (import.meta.env.VITE_META_PIXEL_ID || '').trim();
const DEBUG = import.meta.env.VITE_META_PIXEL_DEBUG === 'true';

export const pixelEnabled = Boolean(PIXEL_ID) && (!import.meta.env.DEV || DEBUG);

let initialized = false;

/** Carrega o script da Meta (assíncrono) e inicia o pixel. Chamar uma vez. */
export function initPixel() {
  if (!pixelEnabled || initialized || typeof window === 'undefined') return;
  initialized = true;

  // Snippet oficial da Meta, sem o fbq('track', 'PageView') do final: a fila
  // (fbq.queue) guarda as chamadas até o fbevents.js terminar de carregar.
  if (!window.fbq) {
    const fbq = function (...args) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    };
    if (!window._fbq) window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  window.fbq('init', PIXEL_ID);
}

/**
 * Evento padrão da Meta. `eventID` (opcional) vai como { eventID } — é o que
 * deixa a API de Conversões deduplicar o mesmo evento vindo do servidor.
 */
export function track(event, params = {}, eventID) {
  if (!pixelEnabled || !initialized || !window.fbq) return;
  if (eventID != null) window.fbq('track', event, params, { eventID: String(eventID) });
  else window.fbq('track', event, params);
}

export function trackPageView() {
  track('PageView');
}

/** Lê um cookie do navegador (para _fbp/_fbc da API de Conversões). */
function readCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Cookies da Meta que existirem: { fbp, fbc } (cada um só se houver). */
export function metaCookies() {
  const fbp = readCookie('_fbp');
  const fbc = readCookie('_fbc');
  return { ...(fbp ? { fbp } : {}), ...(fbc ? { fbc } : {}) };
}

/** Preço como número (a API manda BigDecimal, que pode chegar como texto). */
export function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}
