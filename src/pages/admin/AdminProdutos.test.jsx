import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { adminAuth, renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/store/actions', () => ({
  fetchCategories: () => () => {},
  fetchProducts: () => () => {},
}));
vi.mock('@/services/adminService', () => ({
  listProducts: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  uploadProductImage: vi.fn(),
}));

import * as adminService from '@/services/adminService';
import AdminProdutos from './AdminProdutos';

const PAGE = {
  content: [
    {
      productId: 1,
      productName: 'Vestido Midi',
      image: 'a.jpg',
      price: 259.9,
      specialPrice: 259.9,
      stock: 10,
    },
  ],
  totalPages: 1,
};

const preloaded = {
  ...adminAuth,
  products: {
    products: null,
    categories: [{ categoryId: 7, categoryName: 'Vestidos' }],
    pagination: {},
  },
};

beforeEach(() => vi.clearAllMocks());

describe('AdminProdutos', () => {
  it('lista os produtos', async () => {
    adminService.listProducts.mockResolvedValue(PAGE);
    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    expect(await screen.findByText('Vestido Midi')).toBeInTheDocument();
  });

  it('cria um produto pelo formulario', async () => {
    adminService.listProducts.mockResolvedValue({ content: [], totalPages: 0 });
    adminService.createProduct.mockResolvedValue({ productId: 9 });

    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    await screen.findByText('Nenhum produto');

    fireEvent.click(screen.getByRole('button', { name: 'Novo produto' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Saia Longa Jeans' } });
    fireEvent.change(screen.getByLabelText('Descrição'), {
      target: { value: 'Saia longa em jeans' },
    });
    fireEvent.change(screen.getByLabelText('Preço (R$)'), { target: { value: '199.9' } });
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar produto' }));

    await waitFor(() =>
      expect(adminService.createProduct).toHaveBeenCalledWith(
        7,
        expect.objectContaining({
          productName: 'Saia Longa Jeans',
          price: 199.9,
          specialPrice: 199.9,
        }),
      ),
    );
  });
});
