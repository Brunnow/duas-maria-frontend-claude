import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACK_END_URL}/api`,
  // Autenticacao por cookie (JWT). O navegador envia o cookie
  // automaticamente; nada e guardado em localStorage.
  withCredentials: true,
});

/*
 * Handlers de 401 registrados pelo app (ex.: o authSlice, para marcar a
 * sessao como expirada). Ficam aqui para evitar dependencia circular
 * entre `api` e a store do Redux.
 */
const unauthorizedHandlers = new Set();

export function onUnauthorized(handler) {
  unauthorizedHandlers.add(handler);
  return () => unauthorizedHandlers.delete(handler);
}

/*
 * Endpoints que podem responder 401 por motivos que NAO sao "sessao
 * expirou" — o backend mascara alguns 500 (ex.: usuario sem carrinho)
 * como 401. Um 401 nesses caminhos nao deve derrubar a sessao.
 */
const SESSION_NEUTRAL_401 = ['/carts/users/cart', '/auth/user'];

/*
 * Falha de rede (sem resposta do servidor) em GET: tenta de novo até duas
 * vezes. Navegadores embutidos em apps (ex.: o app do Google no iPhone)
 * pré-carregam a página e cortam conexões ao trocar de tela; sem isto a
 * cliente via "Algo deu errado" por um corte que uma nova tentativa resolve.
 * Só GET: repetir POST/PUT poderia duplicar uma ação.
 */
const NETWORK_RETRY_DELAYS_MS = [500, 1500];

function shouldRetryNetworkError(error) {
  const config = error?.config;
  if (!config || error.response || axios.isCancel(error)) return false;
  if ((config.method || 'get').toLowerCase() !== 'get') return false;
  return (config.__networkRetries || 0) < NETWORK_RETRY_DELAYS_MS.length;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (shouldRetryNetworkError(error)) {
      const config = error.config;
      const attempt = config.__networkRetries || 0;
      config.__networkRetries = attempt + 1;
      await new Promise((resolve) => setTimeout(resolve, NETWORK_RETRY_DELAYS_MS[attempt]));
      return api(config);
    }

    const url = error?.config?.url || '';
    const neutral = SESSION_NEUTRAL_401.some((path) => url.includes(path));
    if (error?.response?.status === 401 && !neutral) {
      unauthorizedHandlers.forEach((handler) => handler(error));
    }
    return Promise.reject(error);
  },
);

export default api;
