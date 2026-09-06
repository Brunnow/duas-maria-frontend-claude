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
  getVariants: vi.fn().mockResolvedValue([]),
  createVariants: vi.fn(),
  deleteVariant: vi.fn(),
  recountStock: vi.fn(),
  registerMovement: vi.fn(),
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
    // Nenhum tamanho marcado -> não cria grade.
    expect(adminService.createVariants).not.toHaveBeenCalled();
  });

  it('cria o produto e a grade de tamanhos de forma integrada', async () => {
    adminService.listProducts.mockResolvedValue({ content: [], totalPages: 0 });
    adminService.createProduct.mockResolvedValue({ productId: 42 });
    adminService.createVariants.mockResolvedValue([{ variantId: 1, size: 'P', stock: 3 }]);

    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    await screen.findByText('Nenhum produto');

    fireEvent.click(screen.getByRole('button', { name: 'Novo produto' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Vestido Midi' } });
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Vestido midi' } });
    fireEvent.change(screen.getByLabelText('Preço (R$)'), { target: { value: '199.9' } });
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '7' } });

    fireEvent.click(screen.getByLabelText('Tamanho P'));
    fireEvent.change(screen.getByLabelText('Estoque inicial P'), { target: { value: '3' } });
    fireEvent.click(screen.getByLabelText('Tamanho M'));

    fireEvent.click(screen.getByRole('button', { name: 'Criar produto' }));

    await waitFor(() => expect(adminService.createProduct).toHaveBeenCalled());
    await waitFor(() =>
      expect(adminService.createVariants).toHaveBeenCalledWith(42, [
        { size: 'P', initialStock: 3 },
        { size: 'M', initialStock: 0 },
      ]),
    );
  });

  it('desabilita "Único" quando ha tamanhos numerados marcados', async () => {
    adminService.listProducts.mockResolvedValue({ content: [], totalPages: 0 });
    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    await screen.findByText('Nenhum produto');

    fireEvent.click(screen.getByRole('button', { name: 'Novo produto' }));
    fireEvent.click(screen.getByLabelText('Tamanho P'));
    expect(screen.getByLabelText('Tamanho Único')).toBeDisabled();
  });
});
