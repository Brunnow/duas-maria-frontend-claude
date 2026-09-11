import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { authenticatedAuth, makeStore } from '@/test/renderWithProviders';

vi.mock('@/services/orderService', () => ({
  fetchOrderById: vi.fn(),
  startMercadoPagoPayment: vi.fn(),
}));
vi.mock('@/services/cartService', () => ({ getCart: vi.fn() }));
vi.mock('@/lib/navigate', () => ({ goToExternal: vi.fn() }));

import { fetchOrderById, startMercadoPagoPayment } from '@/services/orderService';
import { getCart } from '@/services/cartService';
import { goToExternal } from '@/lib/navigate';
import CheckoutRetorno from './CheckoutRetorno';

function renderRetorno(route = '/checkout/retorno?orderId=99') {
  const store = makeStore({ ...authenticatedAuth });
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
  orderId: 99,
  orderStatus: 'PAGO',
  paymentStatus: 'APPROVED',
  totalAmount: 274.8,
  orderItems: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  getCart.mockResolvedValue({ cartId: 1, items: [], totalPrice: 0 });
});

describe('CheckoutRetorno', () => {
  it('sem orderId na URL, mostra estado de nao encontrado', async () => {
    renderRetorno('/checkout/retorno');
    expect(await screen.findByText('Não encontramos esse pedido')).toBeInTheDocument();
    expect(fetchOrderById).not.toHaveBeenCalled();
  });

  it('paymentStatus PENDING mostra tela de confirmando (nao trava esperando o webhook)', async () => {
    fetchOrderById.mockResolvedValue({
      ...ORDER,
      paymentStatus: 'PENDING',
      orderStatus: 'AGUARDANDO_PAGAMENTO',
    });
    renderRetorno();

    expect(await screen.findByText(/Confirmando seu pagamento/)).toBeInTheDocument();
    await waitFor(() => expect(fetchOrderById).toHaveBeenCalledWith('99'));
  });

  it('paymentStatus APPROVED mostra a confirmacao e atualiza o carrinho', async () => {
    fetchOrderById.mockResolvedValue(ORDER);
    renderRetorno();

    expect(await screen.findByText('Pedido realizado!')).toBeInTheDocument();
    expect(screen.getByText(/#99/)).toBeInTheDocument();
    await waitFor(() => expect(getCart).toHaveBeenCalled());
  });

  it('paymentStatus REJECTED oferece tentar novamente', async () => {
    fetchOrderById.mockResolvedValue({
      ...ORDER,
      paymentStatus: 'REJECTED',
      orderStatus: 'AGUARDANDO_PAGAMENTO',
    });
    startMercadoPagoPayment.mockResolvedValue({
      preferenceId: 'p2',
      initPoint: 'https://mp/retry-99',
    });
    renderRetorno();

    expect(await screen.findByText('Pagamento recusado')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(startMercadoPagoPayment).toHaveBeenCalledWith('99'));
    await waitFor(() => expect(goToExternal).toHaveBeenCalledWith('https://mp/retry-99'));
  });

  it('erro ao consultar o pedido mostra estado de nao encontrado', async () => {
    fetchOrderById.mockRejectedValue(new Error('network'));
    renderRetorno();

    expect(await screen.findByText('Não encontramos esse pedido')).toBeInTheDocument();
  });
});
