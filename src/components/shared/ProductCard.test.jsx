import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProductCard from './ProductCard';

const base = {
  productId: 1,
  productName: 'Vestido Midi Linho',
  image: 'https://example.com/vestido.jpg',
  description: 'Vestido midi em linho.',
  quantity: 5,
  price: 299.9,
};

const norm = (s) => s.replace(/\s/g, ' ');

describe('ProductCard', () => {
  it('mostra nome e preco e permite abrir os detalhes', () => {
    render(<ProductCard {...base} />);
    expect(screen.getByText('Vestido Midi Linho')).toBeInTheDocument();
    expect(norm(screen.getByText(/R\$/).textContent)).toBe('R$ 299,90');
    expect(
      screen.getByRole('button', { name: 'Ver detalhes de Vestido Midi Linho' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /adicionar/i })).toBeEnabled();
  });

  it('sinaliza produto esgotado e desabilita o botao', () => {
    render(<ProductCard {...base} quantity={0} />);
    expect(screen.getByText('Esgotado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /indisponível/i })).toBeDisabled();
  });

  it('exibe o percentual de desconto quando ha preco promocional', () => {
    render(<ProductCard {...base} price={400} specialPrice={300} />);
    expect(screen.getByText('-25%')).toBeInTheDocument();
  });
});
