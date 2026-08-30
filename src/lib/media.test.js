import { describe, expect, it } from 'vitest';
import { productImageUrl } from './media';

const BASE = import.meta.env.VITE_BACK_END_URL;

describe('productImageUrl', () => {
  it('prefixa o nome do arquivo com VITE_BACK_END_URL/images/', () => {
    expect(productImageUrl('default.png')).toBe(`${BASE}/images/default.png`);
  });

  it('normaliza um prefixo images/ ou /images/ ja presente', () => {
    expect(productImageUrl('images/foo.jpg')).toBe(`${BASE}/images/foo.jpg`);
    expect(productImageUrl('/images/foo.jpg')).toBe(`${BASE}/images/foo.jpg`);
  });

  it('mantem URLs absolutas intactas', () => {
    expect(productImageUrl('http://x/y.jpg')).toBe('http://x/y.jpg');
    expect(productImageUrl('https://x/y.jpg')).toBe('https://x/y.jpg');
  });

  it('retorna null para valores vazios', () => {
    expect(productImageUrl(null)).toBeNull();
    expect(productImageUrl(undefined)).toBeNull();
    expect(productImageUrl('')).toBeNull();
  });
});
