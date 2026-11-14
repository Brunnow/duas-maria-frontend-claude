import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@/services/publicOrderService', () => ({
  requestOrdersLink: vi.fn(),
  fetchOrdersByAccessToken: vi.fn(),
}));

import { fetchOrdersByAccessToken, requestOrdersLink } from '@/services/publicOrderService';
import AcompanharPedido from './AcompanharPedido';
import PedidosPorLink from './PedidosPorLink';

function renderAt(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/acompanhar-pedido" element={<AcompanharPedido />} />
        <Route path="/acompanhar-pedido/:token" element={<PedidosPorLink />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe('AcompanharPedido', () => {
  it('pede o link por CPF e mostra a mesma mensagem, sem mostrar pedidos', async () => {
    requestOrdersLink.mockResolvedValue({ message: 'ok' });
    renderAt('/acompanhar-pedido');

    fireEvent.change(screen.getByLabelText('E-mail ou CPF'), {
      target: { value: ' 529.982.247-25 ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Receber link por e-mail' }));

    expect(requestOrdersLink).toHaveBeenCalledWith('529.982.247-25');
    expect(
      await screen.findByText(/Se houver pedidos com esses dados, enviamos um link/),
    ).toBeInTheDocument();
    expect(fetchOrdersByAccessToken).not.toHaveBeenCalled();
  });

  it('valida e-mail e CPF antes de enviar', async () => {
    renderAt('/acompanhar-pedido');
    const field = screen.getByLabelText('E-mail ou CPF');
    const submit = screen.getByRole('button', { name: 'Receber link por e-mail' });

    fireEvent.click(submit);
    expect(
      await screen.findByText('Informe o e-mail ou o CPF usado na compra.'),
    ).toBeInTheDocument();

    fireEvent.change(field, { target: { value: '123' } });
    fireEvent.click(submit);
    expect(await screen.findByText('CPF inválido. Digite os 11 números.')).toBeInTheDocument();

    fireEvent.change(field, { target: { value: 'maria@' } });
    fireEvent.click(submit);
    expect(await screen.findByText('E-mail inválido.')).toBeInTheDocument();
    expect(requestOrdersLink).not.toHaveBeenCalled();
  });

  it('avisa quando passou do limite de tentativas', async () => {
    requestOrdersLink.mockRejectedValue({ response: { status: 429 } });
    renderAt('/acompanhar-pedido');

    fireEvent.change(screen.getByLabelText('E-mail ou CPF'), {
      target: { value: 'maria@exemplo.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Receber link por e-mail' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Muitas tentativas');
  });
});

describe('PedidosPorLink', () => {
  it('mostra os pedidos do link com status, peças e total', async () => {
    fetchOrdersByAccessToken.mockResolvedValue({
      maskedEmail: 'ma***@exemplo.com',
      orders: [
        {
          orderId: 88,
          createdAt: '2026-11-14T10:00:00',
          orderStatus: 'PAGO',
          totalAmount: 194.9,
          shippingAddress: {
            recipientName: 'Maria',
            city: 'Recife',
            state: 'PE',
            cep: '50***-000',
          },
          orderItems: [
            {
              orderItemId: 1,
              product: { productName: 'Vestido Midi' },
              size: 'M',
              quantity: 2,
              orderedProductPrice: 90,
            },
          ],
        },
      ],
    });
    renderAt('/acompanhar-pedido/tok-123');

    expect(await screen.findByRole('heading', { name: 'Pedido #88' })).toBeInTheDocument();
    expect(fetchOrdersByAccessToken).toHaveBeenCalledWith('tok-123');
    expect(screen.getByText('Pedidos feitos com ma***@exemplo.com')).toBeInTheDocument();
    expect(screen.getByText('Vestido Midi')).toBeInTheDocument();
    expect(screen.getByText('CEP 50***-000')).toBeInTheDocument();
  });

  it('link vencido: mostra a mensagem e o caminho para pedir outro', async () => {
    fetchOrdersByAccessToken.mockRejectedValue({
      response: {
        status: 404,
        data: { message: 'Link inválido ou expirado. Peça um novo em Acompanhar pedido.' },
      },
    });
    renderAt('/acompanhar-pedido/velho');

    expect(await screen.findByText(/Link inválido ou expirado/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pedir um novo link' })).toHaveAttribute(
      'href',
      '/acompanhar-pedido',
    );
  });
});
