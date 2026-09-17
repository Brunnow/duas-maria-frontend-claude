import { describe, expect, it } from 'vitest';
import { cnpjDigits, cpfDigits, formatCnpj, formatCpf } from './br';

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

describe('cnpjDigits', () => {
  it('remove pontuacao do CNPJ', () => {
    expect(cnpjDigits('12.345.678/0001-99')).toBe('12345678000199');
  });
});

describe('formatCnpj', () => {
  it('formata progressivamente enquanto digita', () => {
    expect(formatCnpj('12')).toBe('12');
    expect(formatCnpj('12345')).toBe('12.345');
    expect(formatCnpj('12345678')).toBe('12.345.678');
    expect(formatCnpj('123456780001')).toBe('12.345.678/0001');
    expect(formatCnpj('12345678000199')).toBe('12.345.678/0001-99');
  });

  it('trunca alem de 14 digitos', () => {
    expect(formatCnpj('123456780001999999')).toBe('12.345.678/0001-99');
  });
});
