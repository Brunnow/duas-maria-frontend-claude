import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import ScrollToTop from './ScrollToTop';

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Link to="/produtos/7">Ver vestido</Link>} />
        <Route path="/produtos/:id" element={<p>Pagina do produto</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe('ScrollToTop', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  it('abre a nova pagina no topo ao clicar num link', () => {
    renderAt('/');
    window.scrollTo.mockClear();
    fireEvent.click(screen.getByRole('link', { name: 'Ver vestido' }));
    expect(screen.getByText('Pagina do produto')).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('nao mexe na rolagem no carregamento inicial (POP)', () => {
    renderAt('/');
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
