/*
 * Navegação de página inteira (sai do SPA) — usada para redirecionar ao
 * Checkout Pro do Mercado Pago. Isolado num módulo próprio só para poder
 * mockar em teste (`vi.mock('@/lib/navigate')`); o jsdom não navega de
 * verdade e reatribuir `window.location.href` direto no componente
 * quebra o ambiente de teste.
 */
export function goToExternal(url) {
  window.location.href = url;
}
