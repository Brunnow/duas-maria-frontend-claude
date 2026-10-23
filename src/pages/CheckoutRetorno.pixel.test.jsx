import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { authenticatedAuth, makeStore } from '@/test/renderWithProviders';

vi.mock('@/services/orderService', () => ({
  fetchOrderById: vi.fn(),
  startMercadoPagoPayment: vi.fn(),
}));
vi.mock('@/services/cartService', () => ({ getCart: vi.fn() }));
vi.mock('@/lib/pixel', async (importOriginal) => ({ ...(await importOriginal()), track: vi.fn() }));

import { fetchOrderById } from '@/services/orderService';
import { getCart } from '@/services/cartService';
import { track } from '@/lib/pixel';
import CheckoutRetorno from './CheckoutRetorno';

const ORDER = {
  orderId: 99,
  orderStatus: 'PAGO',
  paymentStatus: 'APPROVED',
  totalAmount: '294.80', // já com cupom, com frete
  shippingAmount: '20.00',
  orderItems: [
    { product: { productId: 511 }, quantity: 2 },
    { product: { productId: 152 }, quantity: 1 },
    { product: { productId: 511 }, quantity: 1 },
  ],
};

function renderRetorno() {
  const view = render(
    <Provider store={makeStore({ ...authenticatedAuth })}>
      <MemoryRouter initialEntries={['/checkout/retorno?orderId=99']}>
        <CheckoutRetorno />
      </MemoryRouter>
    </Provider>,
  );
  return view;
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  getCart.mockResolvedValue({ cartId: 1, items: [], totalPrice: 0 });
});

describe('CheckoutRetorno — Purchase do Pixel', () => {
  it('pagamento aprovado dispara Purchase com o pedido como event_id, valor sem frete', async () => {
    fetchOrderById.mockResolvedValue(ORDER);
    renderRetorno();
    await screen.findByText('Pedido realizado!');

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(
      'Purchase',
      {
        content_type: 'product',
        content_ids: ['511', '152'],
        value: 274.8,
        currency: 'BRL',
        num_items: 4,
      },
      '99',
    );
  });

  it('F5 na tela de sucesso nao conta a compra de novo', async () => {
    fetchOrderById.mockResolvedValue(ORDER);
    const first = renderRetorno();
    await screen.findByText('Pedido realizado!');
    first.unmount();

    renderRetorno();
    await screen.findByText('Pedido realizado!');
    expect(track).toHaveBeenCalledTimes(1);
  });

  it('pagamento recusado nao dispara Purchase', async () => {
    fetchOrderById.mockResolvedValue({ ...ORDER, paymentStatus: 'REJECTED', orderStatus: 'X' });
    renderRetorno();
    await screen.findByText('Pagamento recusado');
    expect(track).not.toHaveBeenCalled();
  });
});
