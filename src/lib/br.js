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

/** Só os dígitos de um CEP (ex.: "50000-000" -> "50000000"). */
export function cepDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

/** Formata um CEP para "00000-000" enquanto o usuário digita. */
export function formatCep(value) {
  const d = cepDigits(value).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}
