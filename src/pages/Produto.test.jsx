import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { authenticatedAuth, anonymousAuth, makeStore } from '@/test/renderWithProviders';

vi.mock('@/services/productService', () => ({
  getProduct: vi.fn(),
  getProductVariants: vi.fn(),
}));
vi.mock('@/services/cartService', () => ({
  addVariantToCart: vi.fn(),
}));

import { getProduct, getProductVariants } from '@/services/productService';
import { addVariantToCart } from '@/services/cartService';
import Produto from './Produto';

const product = {
  productId: 7,
  productName: 'Blazer Alfaiataria',
  image: 'http://localhost:8080/images/blazer.jpg',
  description: 'Blazer de alfaiataria.',
  price: 459.9,
  specialPrice: 459.9,
  discount: 0,
  inStock: true,
  stock: 7,
};

const renderAt = (id, { auth = authenticatedAuth } = {}) =>
  render(
    <Provider store={makeStore(auth)}>
      <MemoryRouter initialEntries={[`/produtos/${id}`]}>
        <Routes>
          <Route path="/produtos/:id" element={<Produto />} />
          <Route path="/login" element={<div>Tela de login</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Produto (PDP)', () => {
  it('renderiza o produto e o seletor de tamanho, com tamanho sem estoque desabilitado', async () => {
    getProduct.mockResolvedValue(product);
    getProductVariants.mockResolvedValue([
      { variantId: 1, size: 'P', stock: 2, inStock: true },
      { variantId: 2, size: 'M', stock: 0, inStock: false },
    ]);

    renderAt(7);

    expect(await screen.findByRole('heading', { name: 'Blazer Alfaiataria' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'P' })).toBeEnabled();
    expect(screen.getByRole('radio', { name: 'M' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /selecione um tamanho/i })).toBeDisabled();
  });

  it('mostra "produto nao encontrado" quando a API responde 404', async () => {
    getProduct.mockRejectedValue({ response: { status: 404, data: { message: 'x' } } });
    getProductVariants.mockRejectedValue({ response: { status: 404 } });

    renderAt(999);

    expect(await screen.findByText('Produto não encontrado')).toBeInTheDocument();
  });

  it('logado: adiciona ao carrinho usando o variantId (produto sem grade)', async () => {
    getProduct.mockResolvedValue(product);
    getProductVariants.mockResolvedValue([
      { variantId: 55, size: 'Único', stock: 5, inStock: true },
    ]);
    addVariantToCart.mockResolvedValue({});

    renderAt(7);

    const addButton = await screen.findByRole('button', { name: 'Adicionar ao carrinho' });
    addButton.click();

    await waitFor(() => expect(addVariantToCart).toHaveBeenCalledWith(7, 55, 1));
    expect(await screen.findByText('Produto adicionado ao carrinho.')).toBeInTheDocument();
  });

  it('deslogado: clicar em adicionar leva para /login sem chamar a API', async () => {
    getProduct.mockResolvedValue(product);
    getProductVariants.mockResolvedValue([
      { variantId: 55, size: 'Único', stock: 5, inStock: true },
    ]);

    renderAt(7, { auth: anonymousAuth });

    const addButton = await screen.findByRole('button', { name: 'Adicionar ao carrinho' });
    addButton.click();

    expect(await screen.findByText('Tela de login')).toBeInTheDocument();
    expect(addVariantToCart).not.toHaveBeenCalled();
  });

  it('logado: 401 do carrinho redireciona para /login', async () => {
    getProduct.mockResolvedValue(product);
    getProductVariants.mockResolvedValue([
      { variantId: 55, size: 'Único', stock: 5, inStock: true },
    ]);
    addVariantToCart.mockRejectedValue({ response: { status: 401 } });

    renderAt(7);

    const addButton = await screen.findByRole('button', { name: 'Adicionar ao carrinho' });
    addButton.click();

    expect(await screen.findByText('Tela de login')).toBeInTheDocument();
  });
});
