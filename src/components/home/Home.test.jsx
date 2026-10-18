import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Home from './Home';

const fetchProducts = vi.fn(() => ({ type: 'NOOP' }));
vi.mock('@/store/actions', () => ({ fetchProducts: (...args) => fetchProducts(...args) }));
vi.mock('./Hero', () => ({ default: () => null }));
vi.mock('./HighlightsStrip', () => ({ default: () => null }));
vi.mock('./CategoryShowcase', () => ({ default: () => null }));

const product = { productId: 9, productName: 'Blusa Seda', image: '', quantity: 3, price: 120 };

const renderHome = (products, errorMessage = null) => {
  const store = configureStore({
    reducer: {
      products: () => ({ products }),
      errors: () => ({ isLoading: false, errorMessage }),
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </Provider>,
  );
};

describe('Home — peças em destaque', () => {
  beforeEach(() => fetchProducts.mockClear());

  it('busca os produtos mais novos primeiro', () => {
    renderHome([product]);
    expect(fetchProducts).toHaveBeenCalledWith('pageSize=8&sortBy=productId&sortOrder=desc');
  });

  it('tem o link discreto para ver todos os produtos', () => {
    renderHome([product]);
    expect(screen.getByRole('link', { name: 'Ver todos os produtos' })).toHaveAttribute(
      'href',
      '/produtos',
    );
  });

  it('sem produtos, nao mostra o link', () => {
    renderHome([]);
    expect(screen.queryByRole('link', { name: 'Ver todos os produtos' })).not.toBeInTheDocument();
  });

  it('erro ao carregar mostra "Tentar de novo", que busca de novo', () => {
    renderHome([], 'Não conseguimos carregar os produtos agora.');
    expect(fetchProducts).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(fetchProducts).toHaveBeenCalledTimes(2);
  });

  it('com erro na tela, busca de novo quando a pagina volta a ficar visivel', () => {
    renderHome([], 'Não conseguimos carregar os produtos agora.');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(fetchProducts).toHaveBeenCalledTimes(2);
  });
});
