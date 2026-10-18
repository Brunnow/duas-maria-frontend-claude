import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DEFAULT_TITLE, toMetaDescription } from '@/lib/seo';
import Seo from './Seo';

const renderSeo = (props, path = '/produtos/7') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Seo {...props} />
    </MemoryRouter>,
  );

const meta = (selector) => document.head.querySelector(selector)?.getAttribute('content');

describe('Seo', () => {
  it('define titulo, descricao, imagem e link canonico da pagina', () => {
    renderSeo({
      title: 'Vestido Linho',
      description: 'Vestido midi de linho.',
      image: 'https://cdn/x.jpg',
    });
    expect(document.title).toBe('Vestido Linho | Duas Maria');
    expect(meta('meta[name="description"]')).toBe('Vestido midi de linho.');
    expect(meta('meta[property="og:image"]')).toBe('https://cdn/x.jpg');
    expect(document.head.querySelector('link[rel="canonical"]').getAttribute('href')).toBe(
      `${window.location.origin}/produtos/7`,
    );
  });

  it('publica os dados estruturados e limpa tudo ao sair da pagina', () => {
    const { unmount } = renderSeo({
      title: 'Blusa',
      jsonLd: { '@type': 'Product', name: 'Blusa' },
    });
    const script = document.getElementById('seo-jsonld');
    expect(JSON.parse(script.textContent)).toEqual({ '@type': 'Product', name: 'Blusa' });

    unmount();
    expect(document.title).toBe(DEFAULT_TITLE);
    expect(document.getElementById('seo-jsonld')).toBeNull();
  });

  it('corta descricoes longas sem quebrar palavra', () => {
    const text = `${'palavra '.repeat(40)}fim`;
    const result = toMetaDescription(text);
    expect(result.length).toBeLessThanOrEqual(160);
    expect(result.endsWith('palavra…')).toBe(true);
  });
});
