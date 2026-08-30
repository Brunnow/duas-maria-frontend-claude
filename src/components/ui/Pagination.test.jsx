import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Pagination, { buildPages } from './Pagination';

describe('buildPages', () => {
  it('lista todas as paginas quando sao poucas', () => {
    expect(buildPages(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('insere reticencias em torno da pagina atual', () => {
    expect(buildPages(6, 12)).toEqual([1, 2, '…', 5, 6, 7, '…', 11, 12]);
  });
});

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
});
