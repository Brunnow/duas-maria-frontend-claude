import { describe, expect, it } from 'vitest';
import { optimizedImageUrl, productImageUrl } from './media';

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

describe('optimizedImageUrl', () => {
  const UUID = '0b9f3c1e-2d4a-4b6c-8e9f-1a2b3c4d5e6f';

  it('aponta para a cópia ao lado do original, sempre .jpg', () => {
    expect(optimizedImageUrl(`https://imagens.duasmarias.com.br/${UUID}.PNG`)).toBe(
      `https://imagens.duasmarias.com.br/${UUID}-800.jpg`,
    );
    expect(optimizedImageUrl(`http://localhost:8080/images/${UUID}.jpeg`, 'large')).toBe(
      `http://localhost:8080/images/${UUID}-1600.jpg`,
    );
  });

  it('não inventa cópia para o que o backend não gera', () => {
    expect(optimizedImageUrl(`${BASE}/images/default.png`)).toBeNull();
    expect(optimizedImageUrl(`https://x/${UUID}.webp`)).toBeNull();
    expect(optimizedImageUrl(`https://x/${UUID}.gif`)).toBeNull();
    expect(optimizedImageUrl(`https://x/${UUID}-800.jpg`)).toBeNull();
    expect(optimizedImageUrl('https://outro-site.com/foto.jpg')).toBeNull();
    expect(optimizedImageUrl(null)).toBeNull();
  });
});
