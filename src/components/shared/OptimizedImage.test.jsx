import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import OptimizedImage from './OptimizedImage';

const UUID = '0b9f3c1e-2d4a-4b6c-8e9f-1a2b3c4d5e6f';
const ORIGINAL = `https://imagens.duasmarias.com.br/${UUID}.jpg`;

describe('OptimizedImage', () => {
  it('carrega a cópia menor', () => {
    render(<OptimizedImage src={ORIGINAL} alt="Vestido" />);
    expect(screen.getByAltText('Vestido')).toHaveAttribute(
      'src',
      `https://imagens.duasmarias.com.br/${UUID}-800.jpg`,
    );
  });

  it('usa a cópia grande quando pedido', () => {
    render(<OptimizedImage src={ORIGINAL} size="large" alt="Vestido" />);
    expect(screen.getByAltText('Vestido').getAttribute('src')).toMatch(/-1600\.jpg$/);
  });

  it('se a cópia falhar, mostra o original (sem avisar erro)', () => {
    const onError = vi.fn();
    render(<OptimizedImage src={ORIGINAL} alt="Vestido" onError={onError} />);
    const img = screen.getByAltText('Vestido');

    fireEvent.error(img);

    expect(img).toHaveAttribute('src', ORIGINAL);
    expect(onError).not.toHaveBeenCalled();
  });

  it('se o original também falhar, repassa o erro', () => {
    const onError = vi.fn();
    render(<OptimizedImage src={ORIGINAL} alt="Vestido" onError={onError} />);
    const img = screen.getByAltText('Vestido');

    fireEvent.error(img); // cópia
    fireEvent.error(img); // original

    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('foto sem cópia (default.png) vai direto ao original', () => {
    render(<OptimizedImage src="http://localhost:8080/images/default.png" alt="Sem foto" />);
    expect(screen.getByAltText('Sem foto')).toHaveAttribute(
      'src',
      'http://localhost:8080/images/default.png',
    );
  });
});
