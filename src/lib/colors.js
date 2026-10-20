/** Cor inicial do seletor da bolinha. */
export const DEFAULT_HEX = '#1F1F1F';

/** Tamanho máximo do nome da cor (product_variants.color, V35). */
export const COLOR_NAME_MAX = 40;

/** Valor inicial dos campos de cor do admin a partir de uma cor existente (ou vazio). */
export function colorFieldsValue(color = '', colorHex = null) {
  return { name: color, mode: colorHex ? 'hex' : 'photo', hex: colorHex || DEFAULT_HEX };
}

/** Corpo para a API: hex só quando a escolha é a bolinha. */
export function colorPayload(value) {
  return { name: value.name.trim(), hex: value.mode === 'hex' ? value.hex : null };
}
