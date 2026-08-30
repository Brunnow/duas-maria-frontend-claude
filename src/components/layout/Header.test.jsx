import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { authenticatedAuth, renderWithProviders } from '@/test/renderWithProviders';
import Header from './Header';

describe('Header', () => {
  it('mostra o wordmark e a navegacao principal', () => {
    renderWithProviders(<Header />);
    expect(screen.getByRole('link', { name: 'Duas Marias' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Produtos' })).toHaveAttribute('href', '/produtos');
  });

  it('deslogado: mostra "Entrar" e o link do carrinho', () => {
    renderWithProviders(<Header />);
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Carrinho' })).toHaveAttribute('href', '/carrinho');
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toBeInTheDocument();
  });

  it('logado: mostra o menu da conta com o nome do usuario', () => {
    renderWithProviders(<Header />, { preloadedState: authenticatedAuth });
    expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Minha conta' })).toBeInTheDocument();
    expect(screen.getByText('maria')).toBeInTheDocument();
  });
});
