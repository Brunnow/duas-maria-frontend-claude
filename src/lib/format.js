const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Formata uma data (ISO ou Date) como dd/mm/aaaa. Retorna '' se inválida. */
export function formatDate(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return dateFormatter.format(date);
}

/** Formata data e hora (ISO ou Date) como dd/mm/aaaa hh:mm. Retorna '' se inválida. */
export function formatDateTime(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return dateTimeFormatter.format(date);
}

/**
 * Formata um valor numerico como moeda brasileira (R$).
 * Aceita number ou string numerica. Retorna string vazia para
 * valores invalidos.
 */
export function formatCurrency(value) {
  const number = typeof value === 'string' ? Number(value) : value;
  if (number == null || Number.isNaN(number)) return '';
  return brl.format(number);
}

/**
 * Percentual de desconto entre o preco cheio e o preco promocional,
 * arredondado. Retorna null quando nao ha desconto valido.
 */
export function discountPercent(price, specialPrice) {
  const full = Number(price);
  const special = Number(specialPrice);
  if (!full || !special || special >= full) return null;
  return Math.round(((full - special) / full) * 100);
}

/**
 * Preco final a partir do preco cheio e do percentual de desconto,
 * arredondado a 2 casas. Mesma formula da seed do backend.
 */
export function computeSpecialPrice(price, discount) {
  const full = Number(price) || 0;
  const pct = Number(discount) || 0;
  return Math.round((full - (pct / 100) * full) * 100) / 100;
}
