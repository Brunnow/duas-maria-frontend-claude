import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { adminAuth, renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/services/adminOrderService', () => ({
  listOrders: vi.fn(),
  getOrder: vi.fn(),
  updateOrderStatus: vi.fn(),
}));

import * as adminOrderService from '@/services/adminOrderService';
import AdminPedidos from './AdminPedidos';

const page = (rows) => ({
  content: rows,
  pageNumber: 0,
  pageSize: 20,
  totalElements: rows.length,
  totalPages: 1,
  lastPage: true,
});

const row = {
  orderId: 77,
  createdAt: '2026-02-10T14:00:00',
  customerName: 'Maria da Silva',
  email: 'maria@example.com',
  status: 'PAGO',
  totalAmount: 199.9,
  itemCount: 2,
  city: 'Recife',
  state: 'PE',
};

beforeEach(() => vi.clearAllMocks());

describe('AdminPedidos', () => {
  it('lista os pedidos com cliente, cidade/UF, status e total', async () => {
    adminOrderService.listOrders.mockResolvedValue(page([row]));
    renderWithProviders(<AdminPedidos />, { preloadedState: adminAuth });

    expect(await screen.findByText('Pedido #77')).toBeInTheDocument();
    expect(screen.getByText(/Maria da Silva/)).toBeInTheDocument();
    expect(screen.getByText(/Recife\/PE/)).toBeInTheDocument();
    expect(screen.getByText('Pago', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*199,90/)).toBeInTheDocument();
  });

  it('aplica o filtro de status na chamada da API', async () => {
    adminOrderService.listOrders.mockResolvedValue(page([row]));
    renderWithProviders(<AdminPedidos />, { preloadedState: adminAuth });
    await screen.findByText('Pedido #77');

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'ENVIADO' } });
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }));

    await waitFor(() =>
      expect(adminOrderService.listOrders).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'ENVIADO', pageNumber: 0, pageSize: 20 }),
      ),
    );
  });

  it('mostra estado vazio quando não há pedidos', async () => {
    adminOrderService.listOrders.mockResolvedValue(page([]));
    renderWithProviders(<AdminPedidos />, { preloadedState: adminAuth });

    expect(await screen.findByText('Nenhum pedido')).toBeInTheDocument();
  });
});
