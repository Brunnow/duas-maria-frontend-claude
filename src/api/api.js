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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      unauthorizedHandlers.forEach((handler) => handler(error));
    }
    return Promise.reject(error);
  },
);

export default api;
