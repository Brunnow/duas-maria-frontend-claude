import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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
    expect(norm(screen.getByText(/^R\$/).textContent)).toBe('R$ 299,90');
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

  it('mostra o parcelamento em 6x sem juros sobre o preco cheio', () => {
    renderCard({ price: 300 });
    expect(norm(screen.getByText(/sem juros/).textContent)).toBe('ou 6x de R$ 50,00 sem juros');
  });

  it('calcula o parcelamento sobre o preco promocional', () => {
    renderCard({ price: 400, specialPrice: 299.9 });
    expect(norm(screen.getByText(/sem juros/).textContent)).toBe('ou 6x de R$ 49,98 sem juros');
  });

  it('a bolinha troca a foto do card e os links passam a abrir o produto nessa cor', () => {
    renderCard({
      colors: [
        { name: 'Verde', hex: '#2E7D32', image: null, inStock: true },
        { name: 'Floral azul', hex: null, image: 'https://example.com/floral.jpg', inStock: false },
      ],
    });

    expect(screen.getByRole('list', { name: '2 cores' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cor Floral azul (esgotada)' }));

    expect(screen.getByRole('button', { name: 'Cor Floral azul (esgotada)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByAltText('Vestido Midi Linho').getAttribute('src')).toContain('floral');
    expect(
      screen.getByRole('link', { name: 'Ver Vestido Midi Linho na cor Floral azul' }),
    ).toHaveAttribute('href', '/produtos/1?cor=Floral%20azul');
    expect(screen.getByRole('link', { name: /Ver produto/ })).toHaveAttribute(
      'href',
      '/produtos/1?cor=Floral%20azul',
    );
  });

  it('cor so com bolinha mantem a foto principal; tocar de novo desmarca', () => {
    renderCard({
      colors: [
        { name: 'Verde', hex: '#2E7D32', image: null, inStock: true },
        { name: 'Azul', hex: '#1565C0', image: null, inStock: true },
      ],
    });

    const verde = screen.getByRole('button', { name: 'Cor Verde' });
    fireEvent.click(verde);
    expect(screen.getByAltText('Vestido Midi Linho').getAttribute('src')).toContain('vestido');
    expect(screen.getByRole('link', { name: /Ver produto/ })).toHaveAttribute(
      'href',
      '/produtos/1?cor=Verde',
    );

    fireEvent.click(verde);
    expect(verde).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('link', { name: /Ver produto/ })).toHaveAttribute(
      'href',
      '/produtos/1',
    );
  });

  it('com uma cor so (ou sem cor) nao mostra bolinhas', () => {
    renderCard({ colors: [{ name: 'Verde', hex: '#2E7D32', image: null, inStock: true }] });
    expect(screen.queryByRole('list', { name: /cores/ })).not.toBeInTheDocument();
  });

  it('mostra no maximo 5 cores e o "+N" do resto', () => {
    const colors = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((name) => ({
      name,
      hex: '#000000',
      image: null,
      inStock: true,
    }));
    renderCard({ colors });
    expect(screen.getAllByRole('button', { name: /^Cor / })).toHaveLength(5);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });
});
