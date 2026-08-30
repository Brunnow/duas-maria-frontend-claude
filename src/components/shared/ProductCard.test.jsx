import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from './ProductCard';

const base = {
  productId: 1,
  productName: 'Vestido Midi Linho',
  image: 'https://example.com/vestido.jpg',
  quantity: 5,
  price: 299.9,
};

const norm = (s) => s.replace(/\s/g, ' ');

const renderCard = (props) =>
  render(
    <MemoryRouter>
      <ProductCard {...base} {...props} />
    </MemoryRouter>,
  );

describe('ProductCard', () => {
  it('mostra nome e preco e linka para a pagina do produto', () => {
    renderCard();
    expect(norm(screen.getByText(/R\$/).textContent)).toBe('R$ 299,90');
    expect(screen.getByRole('link', { name: 'Ver Vestido Midi Linho' })).toHaveAttribute(
      'href',
      '/produtos/1',
    );
    expect(screen.getByRole('link', { name: 'Ver produto' })).toHaveAttribute(
      'href',
      '/produtos/1',
    );
  });

  it('sinaliza produto esgotado', () => {
    renderCard({ quantity: 0 });
    expect(screen.getByText('Esgotado')).toBeInTheDocument();
  });

  it('exibe o percentual de desconto quando ha preco promocional', () => {
    renderCard({ price: 400, specialPrice: 300 });
    expect(screen.getByText('-25%')).toBeInTheDocument();
  });
});
