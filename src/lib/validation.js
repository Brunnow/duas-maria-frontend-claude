/*
 * Validadores puros para os formularios (validacao manual — sem lib).
 * Cada um retorna uma mensagem de erro (string) ou null quando valido.
 */

export const required =
  (message = 'Campo obrigatório') =>
  (value) =>
    value == null || String(value).trim() === '' ? message : null;

export const minLength = (min, message) => (value) =>
  String(value ?? '').length < min ? message || `Mínimo de ${min} caracteres` : null;

export const maxLength = (max, message) => (value) =>
  String(value ?? '').length > max ? message || `Máximo de ${max} caracteres` : null;

export const isEmail =
  (message = 'E-mail inválido') =>
  (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '')) ? null : message;

export const matches = (getOther, message) => (value) =>
  value === getOther() ? null : message || 'Os valores não conferem';

/** Aplica uma lista de regras a um valor e retorna o primeiro erro. */
export function firstError(value, rules) {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
}

/** Valida um objeto { campo: [regras] } e retorna { campo: mensagem } dos invalidos. */
export function validateForm(values, schema) {
  const errors = {};
  for (const [field, rules] of Object.entries(schema)) {
    const error = firstError(values[field], rules);
    if (error) errors[field] = error;
  }
  return errors;
}
