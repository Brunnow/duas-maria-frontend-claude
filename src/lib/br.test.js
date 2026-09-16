import { describe, expect, it } from 'vitest';
import { cpfDigits, formatCpf } from './br';

describe('cpfDigits', () => {
  it('remove pontuacao do CPF', () => {
    expect(cpfDigits('123.456.789-01')).toBe('12345678901');
  });

  it('lida com valor vazio/nulo', () => {
    expect(cpfDigits(null)).toBe('');
    expect(cpfDigits(undefined)).toBe('');
  });
});

describe('formatCpf', () => {
  it('formata progressivamente enquanto digita', () => {
    expect(formatCpf('123')).toBe('123');
    expect(formatCpf('123456')).toBe('123.456');
    expect(formatCpf('123456789')).toBe('123.456.789');
    expect(formatCpf('12345678901')).toBe('123.456.789-01');
  });

  it('ignora caracteres nao numericos', () => {
    expect(formatCpf('123.456.789-01')).toBe('123.456.789-01');
  });

  it('trunca alem de 11 digitos', () => {
    expect(formatCpf('123456789019999')).toBe('123.456.789-01');
  });
});
