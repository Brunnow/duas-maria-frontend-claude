import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { adminAuth, renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/services/adminService', () => ({
  listProducts: vi.fn(),
  getVariants: vi.fn().mockResolvedValue([]),
  createVariants: vi.fn(),
  deleteVariant: vi.fn(),
  recountStock: vi.fn(),
  registerMovement: vi.fn(),
}));

import * as adminService from '@/services/adminService';
import AdminEstoque from './AdminEstoque';

const page = (names, extra = {}) => ({
  content: names.map((productName, i) => ({ productId: i + 1, productName, stock: 4 })),
  totalPages: 1,
  totalElements: names.length,
  ...extra,
});

beforeEach(() => vi.clearAllMocks());

describe('AdminEstoque', () => {
  it('lista os produtos paginados, em ordem de nome', async () => {
    adminService.listProducts.mockResolvedValue(page(['Blusa', 'Saia']));
    renderWithProviders(<AdminEstoque />, { preloadedState: adminAuth });

    expect(await screen.findByText('Blusa')).toBeInTheDocument();
    expect(adminService.listProducts).toHaveBeenCalledWith({
      pageNumber: 0,
      pageSize: 20,
      sortBy: 'productName',
      sortOrder: 'asc',
      keyword: undefined,
    });
  });

  it('acha produtos além dos primeiros pela busca', async () => {
    adminService.listProducts.mockResolvedValue(page(['Blusa']));
    renderWithProviders(<AdminEstoque />, { preloadedState: adminAuth });
    await screen.findByText('Blusa');

    adminService.listProducts.mockResolvedValue(page(['Vestido 250']));
    fireEvent.change(screen.getByLabelText('Buscar produto'), { target: { value: 'vestido 250' } });

    expect(await screen.findByText('Vestido 250')).toBeInTheDocument();
    expect(adminService.listProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ pageNumber: 0, keyword: 'vestido 250' }),
    );
  });

  it('busca sem resultado mostra estado vazio', async () => {
    adminService.listProducts.mockResolvedValue(page(['Blusa']));
    renderWithProviders(<AdminEstoque />, { preloadedState: adminAuth });
    await screen.findByText('Blusa');

    adminService.listProducts.mockResolvedValue(page([]));
    fireEvent.change(screen.getByLabelText('Buscar produto'), { target: { value: 'xyz' } });

    expect(await screen.findByText('Nenhum produto encontrado')).toBeInTheDocument();
  });

  it('escolhe um produto, mostra a grade e permite trocar', async () => {
    adminService.listProducts.mockResolvedValue(page(['Blusa', 'Saia']));
    renderWithProviders(<AdminEstoque />, { preloadedState: adminAuth });

    fireEvent.click(await screen.findByRole('button', { name: /Saia/ }));

    expect(screen.getByText('Produto:')).toBeInTheDocument();
    await waitFor(() => expect(adminService.getVariants).toHaveBeenCalledWith(2));
    expect(screen.queryByLabelText('Buscar produto')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Trocar produto' }));
    expect(await screen.findByLabelText('Buscar produto')).toBeInTheDocument();
    expect(await screen.findByText('Blusa')).toBeInTheDocument();
  });
});
