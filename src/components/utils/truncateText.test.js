import { describe, expect, it } from 'vitest';
import { truncateText } from './truncateText';

describe('truncateText', () => {
  it('mantem o texto quando esta dentro do limite', () => {
    expect(truncateText('Vestido', 30)).toBe('Vestido');
  });

  it('corta e adiciona reticencias quando excede o limite', () => {
    expect(truncateText('Vestido Floral de Verao Manga Longa', 10)).toBe('Vestido Fl...');
  });

  it('nao quebra com valores nulos ou indefinidos', () => {
    expect(truncateText(undefined, 10)).toBeUndefined();
    expect(truncateText(null, 10)).toBeNull();
  });
});
