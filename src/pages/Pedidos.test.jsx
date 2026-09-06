import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { authenticatedAuth, renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/services/orderService', () => ({
  placeOrder: vi.fn(),
  fetchOrders: vi.fn(),
  fetchOrderById: vi.fn(),
}));

import { fetchOrders } from '@/services/orderService';
import Pedidos from './Pedidos';

const render = () =>
  renderWithProviders(<Pedidos />, { preloadedState: authenticatedAuth, route: '/pedidos' });

beforeEach(() => vi.clearAllMocks());

describe('Pedidos', () => {
  it('mostra o estado vazio quando nao ha pedidos', async () => {
    fetchOrders.mockResolvedValue([]);
    render();
    expect(await screen.findByText('Você ainda não fez nenhum pedido')).toBeInTheDocument();
  });

  it('mostra a mensagem de erro do backend quando a busca falha', async () => {
    fetchOrders.mockRejectedValue({ response: { data: { message: 'Falha ao buscar pedidos' } } });
    render();
    expect(await screen.findByText('Falha ao buscar pedidos')).toBeInTheDocument();
  });

  it('lista os pedidos com data, status e total formatados em pt-BR', async () => {
    fetchOrders.mockResolvedValue([
      {
        orderId: 10,
        createdAt: '2026-01-15T10:30:00',
        orderStatus: 'PAGO',
        totalAmount: 150.5,
        orderItems: [{ orderItemId: 1 }, { orderItemId: 2 }],
      },
    ]);
    render();

    expect(await screen.findByText('Pedido #10')).toBeInTheDocument();
    expect(screen.getByText('Pago')).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*150,50/)).toBeInTheDocument();
    expect(screen.getByText(/15\/01\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/2 itens/)).toBeInTheDocument();
  });
});
