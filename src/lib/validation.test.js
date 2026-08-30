import { describe, expect, it } from 'vitest';
import { isEmail, matches, maxLength, minLength, required, validateForm } from './validation';

describe('validation', () => {
  it('required', () => {
    expect(required()('')).toBeTruthy();
    expect(required()('   ')).toBeTruthy();
    expect(required()('ok')).toBeNull();
  });

  it('minLength / maxLength', () => {
    expect(minLength(3)('ab')).toBeTruthy();
    expect(minLength(3)('abc')).toBeNull();
    expect(maxLength(3)('abcd')).toBeTruthy();
    expect(maxLength(3)('abc')).toBeNull();
  });

  it('isEmail', () => {
    expect(isEmail()('foo')).toBeTruthy();
    expect(isEmail()('foo@bar')).toBeTruthy();
    expect(isEmail()('foo@bar.com')).toBeNull();
  });

  it('matches', () => {
    const rule = matches(() => 'abc', 'nao confere');
    expect(rule('abc')).toBeNull();
    expect(rule('xyz')).toBe('nao confere');
  });

  it('validateForm retorna apenas os campos invalidos, com o primeiro erro', () => {
    const errors = validateForm(
      { user: '', name: 'ok' },
      { user: [required('obrigatório'), minLength(3)], name: [required('obrigatório')] },
    );
    expect(errors).toEqual({ user: 'obrigatório' });
  });
});
