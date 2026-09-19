import api from '@/api/api';

/*
 * Autenticacao — contratos reais do backend (com.ecommerce.duas_marias,
 * AuthController, base /api/auth):
 *
 *   POST /signin  { username, password }        -> 200 { id, username, roles[] } + Set-Cookie
 *                                                  (o JWT só vai no cookie HttpOnly, nunca no corpo)
 *                                                  404 { message, status:false } em credenciais invalidas
 *   POST /signup  { username, email, password } -> 200 { message } | 400 { message }
 *   GET  /user                                  -> 200 { id, username, roles[] } (via cookie)
 *   POST /signout                               -> 200 { message } + Set-Cookie limpando
 *
 * Login e por username (nao e-mail). O cookie e gerido pelo navegador.
 */

export function signin({ username, password }) {
  return api.post('/auth/signin', { username, password }).then((response) => response.data);
}

export function signup({ username, email, password }) {
  return api.post('/auth/signup', { username, email, password }).then((response) => response.data);
}

export function currentUser() {
  return api.get('/auth/user').then((response) => response.data);
}

export function signout() {
  return api.post('/auth/signout').then((response) => response.data);
}
