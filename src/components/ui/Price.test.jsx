import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Price from './Price';

const norm = (s) => s.replace(/\s/g, ' ');

describe('Price', () => {
  it('mostra apenas o preco quando nao ha promocao', () => {
    render(<Price price={1450} />);
    expect(norm(screen.getByText(/R\$/).textContent)).toBe('R$ 1.450,00');
  });

  it('mostra preco promocional, preco cheio riscado e desconto', () => {
    const { container } = render(<Price price={1450} specialPrice={1305} showDiscount />);
    expect(norm(container.textContent)).toContain('R$ 1.305,00');
    expect(norm(container.textContent)).toContain('R$ 1.450,00');
    expect(container.textContent).toContain('-10%');
  });

  it('ignora specialPrice invalido (maior ou igual ao preco)', () => {
    const { container } = render(<Price price={100} specialPrice={120} showDiscount />);
    expect(container.textContent).not.toContain('-');
    expect(norm(container.textContent)).toBe('R$ 100,00');
  });
});
