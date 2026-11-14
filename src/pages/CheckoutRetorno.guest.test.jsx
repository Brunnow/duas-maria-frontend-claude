import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { anonymousAuth, makeStore } from '@/test/renderWithProviders';

vi.mock('@/services/orderService', () => ({
  fetchOrderById: vi.fn(),
  startMercadoPagoPayment: vi.fn(),
}));
vi.mock('@/services/publicOrderService', () => ({
  fetchOrdersByAccessToken: vi.fn(),
  requestOrdersLink: vi.fn(),
}));
vi.mock('@/services/guestCheckoutService', () => ({ startGuestPayment: vi.fn() }));
vi.mock('@/lib/navigate', () => ({ goToExternal: vi.fn() }));
vi.mock('@/lib/pixel', async (importOriginal) => ({ ...(await importOriginal()), track: vi.fn() }));

import { fetchOrderById } from '@/services/orderService';
import { fetchOrdersByAccessToken } from '@/services/publicOrderService';
import { startGuestPayment } from '@/services/guestCheckoutService';
import { goToExternal } from '@/lib/navigate';
import { track } from '@/lib/pixel';
import { rememberGuestOrder } from '@/lib/guestOrders';
import { readGuestCart, writeGuestCart } from '@/lib/guestCart';
import CheckoutRetorno from './CheckoutRetorno';

function renderRetorno(route = '/checkout/retorno?orderId=88') {
  const store = makeStore({ ...anonymousAuth });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <CheckoutRetorno />
      </MemoryRouter>
    </Provider>,
  );
  return store;
}

const ORDER = {
  orderId: 88,
  orderStatus: 'PAGO',
  paymentStatus: 'APPROVED',
  totalAmount: 274.8,
  shippingAmount: 14.9,
  orderItems: [
    {
      orderItemId: 1,
      variantId: 7,
      product: { productId: 2 },
      quantity: 1,
      orderedProductPrice: 259.9,
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('CheckoutRetorno sem cadastro', () => {
  it('aprovado: consulta pelo link guardado, confirma, dispara o Purchase e tira do carrinho só o que foi pago', async () => {
    rememberGuestOrder(88, 'tok-88');
    writeGuestCart([
      { productId: 2, variantId: 7, quantity: 1, unitPrice: 259.9 },
      { productId: 3, variantId: 9, quantity: 1, unitPrice: 99.9 },
    ]);
    fetchOrdersByAccessToken.mockResolvedValue({ orders: [{ ...ORDER, orderId: 12 }, ORDER] });
    renderRetorno();

    expect(await screen.findByText('Pedido realizado!')).toBeInTheDocument();
    expect(fetchOrdersByAccessToken).toHaveBeenCalledWith('tok-88');
    expect(fetchOrderById).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Ver detalhes do pedido' })).toHaveAttribute(
      'href',
      '/acompanhar-pedido/tok-88',
    );
    await waitFor(() =>
      expect(track).toHaveBeenCalledWith(
        'Purchase',
        expect.objectContaining({ value: 259.9 }),
        '88',
      ),
    );
    expect(readGuestCart().map((i) => i.variantId)).toEqual([9]);
  });

  it('recusado: tenta de novo pelo link do pedido', async () => {
    rememberGuestOrder(88, 'tok-88');
    fetchOrdersByAccessToken.mockResolvedValue({
      orders: [{ ...ORDER, paymentStatus: 'REJECTED', orderStatus: 'AGUARDANDO_PAGAMENTO' }],
    });
    startGuestPayment.mockResolvedValue({ initPoint: 'https://mp/retry-88' });
    renderRetorno();

    fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(goToExternal).toHaveBeenCalledWith('https://mp/retry-88'));
    expect(startGuestPayment).toHaveBeenCalledWith('88', 'tok-88');
  });

  it('sem o link neste navegador: manda para Acompanhar pedido', async () => {
    renderRetorno();

    expect(await screen.findByText('Não encontramos esse pedido')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Acompanhar pedido' })).toHaveAttribute(
      'href',
      '/acompanhar-pedido',
    );
    expect(fetchOrdersByAccessToken).not.toHaveBeenCalled();
  });
});
