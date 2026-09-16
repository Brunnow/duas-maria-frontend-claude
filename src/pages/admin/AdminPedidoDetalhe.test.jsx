import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { adminAuth, makeStore } from '@/test/renderWithProviders';

vi.mock('@/services/adminOrderService', () => ({
  listOrders: vi.fn(),
  getOrder: vi.fn(),
  updateOrderStatus: vi.fn(),
  retryRefund: vi.fn(),
  updateOrderTracking: vi.fn(),
}));

import {
  getOrder,
  retryRefund,
  updateOrderStatus,
  updateOrderTracking,
} from '@/services/adminOrderService';
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

// Navega entre dois pedidos SEM desmontar o componente (mesmo padrão de rota
// que o app usa de verdade — /admin/pedidos/:id só troca o param, o React
// Router não remonta sozinho).
function renderWithNavigationBetween(idA, idB) {
  const store = makeStore(adminAuth);
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/admin/pedidos/${idA}`]}>
        <Routes>
          <Route
            path="/admin/pedidos/:id"
            element={
              <>
                <Link to={`/admin/pedidos/${idB}`}>ir pro outro pedido</Link>
                <AdminPedidoDetalhe />
              </>
            }
          />
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

  // ---------- Fase ME7-lite: rastreio ----------

  it('pedido pago sem codigo de rastreio mostra o formulario pra cadastrar', async () => {
    getOrder.mockResolvedValueOnce(detail());
    getOrder.mockResolvedValue(
      detail({ order: { shippingTrackingCode: 'BR123456789BR', melhorEnvioStatus: 'posted' } }),
    );
    updateOrderTracking.mockResolvedValue({});
    renderAt(77);

    await screen.findByRole('heading', { name: 'Pedido #77' });
    expect(screen.getByLabelText('Código de rastreio')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Código de rastreio'), {
      target: { value: 'BR123456789BR' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rastreio' }));

    await waitFor(() => expect(updateOrderTracking).toHaveBeenCalledWith('77', 'BR123456789BR'));
    expect(await screen.findByText('Postado')).toBeInTheDocument();
    expect(screen.getByText('Código: BR123456789BR')).toBeInTheDocument();
  });

  it('pedido com rastreio ja registrado mostra status e permite corrigir o codigo', async () => {
    getOrder.mockResolvedValue(
      detail({
        order: {
          shippingTrackingCode: 'BR123456789BR',
          melhorEnvioStatus: 'delivered',
          shippingDeliveredAt: '2026-02-15T10:00:00',
        },
      }),
    );
    renderAt(77);

    await screen.findByRole('heading', { name: 'Pedido #77' });
    expect(screen.getByText('Entregue')).toBeInTheDocument();
    expect(screen.getByText(/Entregue em:/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Código de rastreio')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Corrigir código' }));

    expect(screen.getByLabelText('Código de rastreio')).toHaveValue('BR123456789BR');
  });

  it('trocar de pedido (so o :id muda, sem remontar) limpa o formulario de rastreio do pedido anterior', async () => {
    getOrder.mockImplementation((id) =>
      Promise.resolve(
        Number(id) === 77
          ? detail({
              order: { shippingTrackingCode: 'BR123456789BR', melhorEnvioStatus: 'posted' },
            })
          : detail({ order: { orderId: 78, shippingTrackingCode: null } }),
      ),
    );
    renderWithNavigationBetween(77, 78);

    await screen.findByRole('heading', { name: 'Pedido #77' });
    fireEvent.click(screen.getByRole('button', { name: 'Corrigir código' }));
    expect(screen.getByLabelText('Código de rastreio')).toHaveValue('BR123456789BR');

    fireEvent.click(screen.getByRole('link', { name: 'ir pro outro pedido' }));

    await screen.findByRole('heading', { name: 'Pedido #78' });
    // Pedido 78 nao tem codigo ainda -> formulario tem que estar vazio, nao
    // com o codigo que sobrou do pedido 77.
    expect(screen.getByLabelText('Código de rastreio')).toHaveValue('');
  });

  it('pedido aguardando pagamento nao mostra secao de rastreio', async () => {
    getOrder.mockResolvedValue(
      detail({
        order: { orderStatus: 'AGUARDANDO_PAGAMENTO' },
        allowedNextStatus: ['PAGO', 'CANCELADO'],
      }),
    );
    renderAt(77);

    await screen.findByRole('heading', { name: 'Pedido #77' });
    expect(screen.queryByText('Rastreio')).not.toBeInTheDocument();
  });

  it('erro ao salvar rastreio mostra a mensagem do backend', async () => {
    getOrder.mockResolvedValue(detail());
    updateOrderTracking.mockRejectedValue({
      response: { data: { message: 'Só é possível registrar rastreio para um pedido pago.' } },
    });
    renderAt(77);

    await screen.findByRole('heading', { name: 'Pedido #77' });
    fireEvent.change(screen.getByLabelText('Código de rastreio'), {
      target: { value: 'BR123456789BR' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rastreio' }));

    expect(
      await screen.findByText('Só é possível registrar rastreio para um pedido pago.'),
    ).toBeInTheDocument();
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
