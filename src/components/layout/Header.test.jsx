import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );

describe('Header', () => {
  it('mostra o wordmark e a navegacao principal', () => {
    renderHeader();
    expect(screen.getByRole('link', { name: 'Duas Marias' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Produtos' })).toHaveAttribute('href', '/produtos');
  });

  it('expoe as acoes de conta e carrinho', () => {
    renderHeader();
    expect(screen.getByRole('link', { name: 'Minha conta' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Carrinho' })).toHaveAttribute('href', '/carrinho');
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toBeInTheDocument();
  });
});
