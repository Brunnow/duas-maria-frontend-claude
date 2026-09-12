import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { adminAuth, makeStore } from '@/test/renderWithProviders';

vi.mock('@/services/adminOrderService', () => ({
  listOrders: vi.fn(),
  getOrder: vi.fn(),
  updateOrderStatus: vi.fn(),
  retryRefund: vi.fn(),
}));

import { getOrder, retryRefund, updateOrderStatus } from '@/services/adminOrderService';
import AdminPedidoDetalhe from './AdminPedidoDetalhe';

function renderAt(id) {
  const store = makeStore(adminAuth);
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/admin/pedidos/${id}`]}>
        <Routes>
          <Route path="/admin/pedidos/:id" element={<AdminPedidoDetalhe />} />
          <Route path="/admin/pedidos" element={<div>Lista admin</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

const detail = (overrides = {}) => {
  const { order: orderOverrides, ...rest } = overrides;
  return {
    order: {
      orderId: 77,
      email: 'maria@example.com',
      createdAt: '2026-02-10T14:00:00',
      orderStatus: 'PAGO',
      totalAmount: 199.9,
      shippingAmount: 14.9,
      shippingMethod: 'FIXED_UF',
      orderItems: [
        {
          orderItemId: 1,
          product: { productName: 'Vestido Midi Floral' },
          size: 'M',
          sku: 'VEST-M',
          quantity: 1,
          orderedProductPrice: 185.0,
        },
      ],
      shippingAddress: {
        recipientName: 'Maria da Silva',
        city: 'Recife',
        state: 'PE',
        street: 'Rua das Flores',
        number: '123',
      },
      ...orderOverrides,
    },
    customerName: 'Maria da Silva',
    customerUsername: 'maria',
    statusHistory: [
      {
        id: 1,
        fromStatus: null,
        toStatus: 'PAGO',
        changedBy: null,
        changedAt: '2026-02-10T14:00:00',
        note: null,
      },
    ],
    allowedNextStatus: ['SEPARANDO', 'CANCELADO'],
    webhookEvents: [],
    ...rest,
  };
};

beforeEach(() => vi.clearAllMocks());

describe('AdminPedidoDetalhe', () => {
  it('mostra itens, cliente, entrega, total e histórico', async () => {
    getOrder.mockResolvedValue(detail());
    renderAt(77);

    expect(await screen.findByRole('heading', { name: 'Pedido #77' })).toBeInTheDocument();
    expect(screen.getByText('Vestido Midi Floral')).toBeInTheDocument();
    expect(screen.getByText('@maria')).toBeInTheDocument();
    expect(screen.getByText('maria@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Rua das Flores/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*199,90/)).toBeInTheDocument();
    expect(screen.getByText('Histórico')).toBeInTheDocument();
  });

  it('mostra mensagem amigável quando o pedido não existe (404)', async () => {
    getOrder.mockRejectedValue({ response: { status: 404 } });
    renderAt(999);

    expect(await screen.findByText('Pedido não encontrado.')).toBeInTheDocument();
  });

  it('altera o status e atualiza a tela sem reload', async () => {
    getOrder.mockResolvedValueOnce(detail());
    // Qualquer refetch após a troca devolve o pedido já em SEPARANDO.
    getOrder.mockResolvedValue(
      detail({ order: { orderStatus: 'SEPARANDO' }, allowedNextStatus: ['ENVIADO', 'CANCELADO'] }),
    );
    updateOrderStatus.mockResolvedValue({});
    renderAt(77);

    await screen.findByRole('heading', { name: 'Pedido #77' });
    fireEvent.change(screen.getByLabelText('Novo status'), { target: { value: 'SEPARANDO' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar status' }));

    await waitFor(() =>
      expect(updateOrderStatus).toHaveBeenCalledWith('77', {
        status: 'SEPARANDO',
        note: undefined,
      }),
    );
    // Feedback de sucesso + recarga dos dados (tela atualiza sem reload manual).
    expect(await screen.findByText(/Status alterado para Separando/)).toBeInTheDocument();
    await waitFor(() => expect(getOrder).toHaveBeenCalledTimes(2));
  });

  it('mostra o erro do backend quando a transição é inválida', async () => {
    getOrder.mockResolvedValue(detail());
    updateOrderStatus.mockRejectedValue({
      response: { data: { message: 'Não é possível mudar o status de PAGO para ENTREGUE.' } },
    });
    renderAt(77);

    await screen.findByRole('heading', { name: 'Pedido #77' });
    fireEvent.change(screen.getByLabelText('Novo status'), { target: { value: 'CANCELADO' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar status' }));

    expect(
      await screen.findByText('Não é possível mudar o status de PAGO para ENTREGUE.'),
    ).toBeInTheDocument();
  });

  it('pedido em status final não mostra formulário de troca', async () => {
    getOrder.mockResolvedValue(
      detail({ order: { orderStatus: 'ENTREGUE' }, allowedNextStatus: [] }),
    );
    renderAt(77);

    await screen.findByRole('heading', { name: 'Pedido #77' });
    expect(screen.getByText(/status final e não pode ser alterado/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Novo status')).not.toBeInTheDocument();
  });

  it('mostra o status e os dados do pagamento Mercado Pago', async () => {
    getOrder.mockResolvedValue(
      detail({
        order: {
          payment: {
            status: 'APPROVED',
            provider: 'MERCADO_PAGO',
            providerPaymentId: 'mp-123',
            amount: 199.9,
            paidAt: '2026-02-10T14:05:00',
          },
        },
      }),
    );
    renderAt(77);

    await screen.findByRole('heading', { name: 'Pedido #77' });
    expect(screen.getByText('Aprovado')).toBeInTheDocument();
    expect(screen.getByText('Provedor: MERCADO_PAGO')).toBeInTheDocument();
    expect(screen.getByText('Id do pagamento: mp-123')).toBeInTheDocument();
  });

  it('pagamento em estorno pendente mostra botão de tentar de novo', async () => {
    getOrder.mockResolvedValueOnce(
      detail({
        order: {
          payment: {
            status: 'REFUND_PENDING',
            provider: 'MERCADO_PAGO',
            providerPaymentId: 'mp-123',
          },
        },
      }),
    );
    getOrder.mockResolvedValue(
      detail({
        order: {
          payment: { status: 'REFUNDED', provider: 'MERCADO_PAGO', providerPaymentId: 'mp-123' },
        },
      }),
    );
    retryRefund.mockResolvedValue({});
    renderAt(77);

    await screen.findByRole('heading', { name: 'Pedido #77' });
    fireEvent.click(screen.getByRole('button', { name: 'Tentar estorno novamente' }));

    await waitFor(() => expect(retryRefund).toHaveBeenCalledWith('77'));
    expect(await screen.findByText('Estornado')).toBeInTheDocument();
  });

  it('mostra a timeline de eventos de webhook quando houver', async () => {
    getOrder.mockResolvedValue(
      detail({
        webhookEvents: [
          {
            id: 1,
            topic: 'payment',
            status: 'PROCESSED',
            receivedAt: '2026-02-10T14:05:00',
            error: null,
          },
        ],
      }),
    );
    renderAt(77);

    await screen.findByRole('heading', { name: 'Pedido #77' });
    expect(screen.getByText('Eventos de webhook')).toBeInTheDocument();
    expect(screen.getByText(/Processado/)).toBeInTheDocument();
  });
});
