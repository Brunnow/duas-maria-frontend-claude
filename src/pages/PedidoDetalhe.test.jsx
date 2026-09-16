import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { authenticatedAuth, makeStore } from '@/test/renderWithProviders';

vi.mock('@/services/orderService', () => ({
  placeOrder: vi.fn(),
  fetchOrders: vi.fn(),
  fetchOrderById: vi.fn(),
}));

import { fetchOrderById } from '@/services/orderService';
import PedidoDetalhe from './PedidoDetalhe';

function renderAt(id) {
  const store = makeStore(authenticatedAuth);
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/pedidos/${id}`]}>
        <Routes>
          <Route path="/pedidos/:id" element={<PedidoDetalhe />} />
          <Route path="/pedidos" element={<div>Lista de pedidos</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

const order = {
  orderId: 42,
  createdAt: '2026-02-10T14:00:00',
  orderStatus: 'ENVIADO',
  totalAmount: 279.8,
  orderItems: [
    {
      orderItemId: 1,
      product: { productName: 'Vestido Midi Floral' },
      size: 'M',
      quantity: 2,
      orderedProductPrice: 139.9,
    },
  ],
};

beforeEach(() => vi.clearAllMocks());

describe('PedidoDetalhe', () => {
  it('mostra os itens, tamanho, subtotal, total, data e status do pedido', async () => {
    fetchOrderById.mockResolvedValue(order);
    renderAt(42);

    expect(await screen.findByRole('heading', { name: 'Pedido #42' })).toBeInTheDocument();
    expect(screen.getByText('Vestido Midi Floral')).toBeInTheDocument();
    expect(screen.getByText(/Tamanho M/)).toBeInTheDocument();
    expect(screen.getByText(/Qtd\. 2/)).toBeInTheDocument();
    // subtotal do item (2 x R$139,90) e o total do pedido coincidem (1 item so) - aparece 2x.
    expect(screen.getAllByText(/R\$\s*279,80/)).toHaveLength(2);
    expect(screen.getByText('Enviado')).toBeInTheDocument();
    expect(screen.getByText(/10\/02\/2026/)).toBeInTheDocument();
  });

  it('mostra mensagem amigavel quando o pedido nao existe ou nao pertence ao usuario (404)', async () => {
    fetchOrderById.mockRejectedValue({ response: { status: 404 } });
    renderAt(999);

    expect(await screen.findByText('Pedido não encontrado.')).toBeInTheDocument();
  });

  it('mostra o frete quando o pedido tem shippingAmount', async () => {
    fetchOrderById.mockResolvedValue({
      ...order,
      shippingAmount: 14.9,
      shippingMethod: 'FIXED_UF',
      totalAmount: 294.7,
    });
    renderAt(42);

    expect(await screen.findByText(/Frete · Entrega padrão/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*14,90/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*294,70/)).toBeInTheDocument();
  });

  it('pedido antigo sem frete: nao mostra linha de frete', async () => {
    fetchOrderById.mockResolvedValue(order); // sem shippingAmount
    renderAt(42);

    await screen.findByRole('heading', { name: 'Pedido #42' });
    expect(screen.queryByText(/Frete/)).not.toBeInTheDocument();
  });

  // ---------- Fase ME7-lite: rastreio ----------

  it('pedido sem codigo de rastreio nao mostra a secao de rastreio', async () => {
    fetchOrderById.mockResolvedValue(order);
    renderAt(42);

    await screen.findByRole('heading', { name: 'Pedido #42' });
    expect(screen.queryByText('Rastreio')).not.toBeInTheDocument();
  });

  it('pedido postado mostra o rastreio com a data de postagem', async () => {
    fetchOrderById.mockResolvedValue({
      ...order,
      shippingTrackingCode: 'BR123456789BR',
      melhorEnvioStatus: 'posted',
      shippingPostedAt: '2026-02-11T09:00:00',
    });
    renderAt(42);

    expect(await screen.findByText('Rastreio')).toBeInTheDocument();
    expect(screen.getByText('Postado')).toBeInTheDocument();
    expect(screen.getByText('Código: BR123456789BR')).toBeInTheDocument();
    expect(screen.getByText(/Postado em 11\/02\/2026/)).toBeInTheDocument();
  });

  it('pedido entregue mostra o rastreio com a data de entrega', async () => {
    fetchOrderById.mockResolvedValue({
      ...order,
      shippingTrackingCode: 'BR123456789BR',
      melhorEnvioStatus: 'delivered',
      shippingPostedAt: '2026-02-11T09:00:00',
      shippingDeliveredAt: '2026-02-15T16:30:00',
    });
    renderAt(42);

    expect(await screen.findByText('Entregue', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText(/Entregue em 15\/02\/2026/)).toBeInTheDocument();
  });
});
