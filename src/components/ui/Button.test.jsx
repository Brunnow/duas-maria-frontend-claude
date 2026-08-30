import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('renderiza o texto e responde ao clique', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Comprar</Button>);
    const btn = screen.getByRole('button', { name: 'Comprar' });
    expect(btn).toBeInTheDocument();
    btn.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('fica desabilitado e aria-busy quando loading', () => {
    render(<Button loading>Enviar</Button>);
    const btn = screen.getByRole('button', { name: /enviar/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('renderiza como outro elemento via prop `as`', () => {
    render(
      <Button as="a" href="/produtos">
        Ver produtos
      </Button>,
    );
    expect(screen.getByRole('link', { name: 'Ver produtos' })).toHaveAttribute('href', '/produtos');
  });
});
