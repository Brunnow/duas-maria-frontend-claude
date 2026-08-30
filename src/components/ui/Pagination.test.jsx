import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Pagination from './Pagination';

describe('Pagination', () => {
  it('nao renderiza com uma unica pagina', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('chama onChange com a pagina escolhida e desabilita "Anterior" na primeira', () => {
    const onChange = vi.fn();
    render(<Pagination page={1} totalPages={5} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    screen.getByRole('button', { name: '3' }).click();
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('marca a pagina atual com aria-current', () => {
    render(<Pagination page={2} totalPages={5} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');
  });
});
