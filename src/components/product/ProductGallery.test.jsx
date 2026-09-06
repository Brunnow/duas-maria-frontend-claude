import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ProductGallery from './ProductGallery';

describe('ProductGallery', () => {
  it('usa a string `image` como fallback quando nao ha `images`', () => {
    render(<ProductGallery image="http://x/a.jpg" alt="Vestido" />);
    const img = screen.getByRole('img', { name: 'Vestido' });
    expect(img).toHaveAttribute('src', 'http://x/a.jpg');
    // uma imagem só -> sem miniaturas
    expect(screen.queryByRole('button', { name: /Ver imagem/ })).not.toBeInTheDocument();
  });

  it('mostra miniaturas e troca a imagem principal ao clicar', () => {
    const images = [
      { url: 'http://x/1.jpg', alt: 'Frente', primary: true },
      { url: 'http://x/2.jpg', alt: 'Costas' },
      { url: 'http://x/3.jpg', alt: 'Detalhe' },
    ];
    render(<ProductGallery images={images} alt="Vestido" />);

    // principal inicial = primeira
    expect(screen.getByRole('img', { name: 'Frente' })).toHaveAttribute('src', 'http://x/1.jpg');
    const thumbs = screen.getAllByRole('button', { name: /Ver imagem/ });
    expect(thumbs).toHaveLength(3);

    fireEvent.click(thumbs[2]);
    expect(screen.getByRole('img', { name: 'Detalhe' })).toHaveAttribute('src', 'http://x/3.jpg');
  });

  it('mostra "sem imagem" quando nao ha nada', () => {
    render(<ProductGallery alt="Vestido" />);
    expect(screen.getByText('sem imagem')).toBeInTheDocument();
  });
});
