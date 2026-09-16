/** Unidades federativas do Brasil (para o <select> de UF). */
export const UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
];

function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '');
}

/** Só os dígitos de um CEP (ex.: "50000-000" -> "50000000"). */
export function cepDigits(value) {
  return digitsOnly(value);
}

/** Formata um CEP para "00000-000" enquanto o usuário digita. */
export function formatCep(value) {
  const d = cepDigits(value).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** Só os dígitos de um CPF (ex.: "123.456.789-01" -> "12345678901"). */
export function cpfDigits(value) {
  return digitsOnly(value);
}

/** Formata um CPF para "000.000.000-00" enquanto o usuário digita. */
export function formatCpf(value) {
  const d = cpfDigits(value).slice(0, 11);
  const parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean);
  let formatted = parts.join('.');
  if (d.length > 9) formatted += `-${d.slice(9)}`;
  return formatted;
}
