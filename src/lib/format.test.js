import { describe, expect, it } from 'vitest';
import { discountPercent, formatCurrency } from './format';

// O Intl insere um espaco nao separavel (que varia entre versoes do ICU)
// entre "R$" e o valor; normalizamos para um espaco comum antes de comparar.
const norm = (s) => s.replace(/\s/g, ' ');

describe('formatCurrency', () => {
  it('formata numero como BRL', () => {
    expect(norm(formatCurrency(1450))).toBe('R$ 1.450,00');
    expect(norm(formatCurrency(1305.5))).toBe('R$ 1.305,50');
  });

  it('aceita string numerica', () => {
    expect(norm(formatCurrency('99.9'))).toBe('R$ 99,90');
  });

  it('retorna string vazia para valores invalidos', () => {
    expect(formatCurrency(null)).toBe('');
    expect(formatCurrency(undefined)).toBe('');
    expect(formatCurrency('abc')).toBe('');
  });
});

describe('discountPercent', () => {
  it('calcula o percentual arredondado', () => {
    expect(discountPercent(1450, 1305)).toBe(10);
    expect(discountPercent(200, 150)).toBe(25);
  });

  it('retorna null quando nao ha desconto valido', () => {
    expect(discountPercent(100, 100)).toBeNull();
    expect(discountPercent(100, 120)).toBeNull();
    expect(discountPercent(100, 0)).toBeNull();
    expect(discountPercent(0, 0)).toBeNull();
  });
});
