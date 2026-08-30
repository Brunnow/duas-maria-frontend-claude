import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { authenticatedAuth, cartState, makeStore } from '@/test/renderWithProviders';

vi.mock('@/services/orderService', () => ({ placeOrder: vi.fn() }));
vi.mock('@/services/addressService', () => ({
  getUserAddresses: vi.fn().mockResolvedValue([]),
  createAddress: vi.fn(),
  updateAddress: vi.fn(),
  deleteAddress: vi.fn(),
}));

import { placeOrder } from '@/services/orderService';
import Checkout from './Checkout';

const ITEM = {
  cartItemId: 1,
  productId: 2,
  variantId: 7,
  productName: 'Vestido Midi',
  size: 'M',
  image: 'http://x/a.jpg',
  unitPrice: 259.9,
  quantity: 1,
  lineTotal: 259.9,
};

const ADDRESS = {
  addressId: 1,
  street: 'Rua das Flores',
  buildingName: 'Apto 1',
  city: 'Recife',
  state: 'PE',
  country: 'Brasil',
  pincode: '50000000',
};

function renderCheckout({ items = [ITEM], addresses = [ADDRESS] } = {}) {
  const store = makeStore({
    ...authenticatedAuth,
    ...cartState(items),
    address: { items: addresses, status: 'ready', error: null },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/checkout']}>
        <Routes>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/carrinho" element={<div>Pagina do carrinho</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
}

const goThroughSteps = () => {
  fireEvent.click(screen.getByRole('radio', { name: /Rua das Flores/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  fireEvent.click(screen.getByRole('radio', { name: /PIX/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
};

beforeEach(() => vi.clearAllMocks());

describe('Checkout', () => {
  it('redireciona para o carrinho quando esta vazio', () => {
    renderCheckout({ items: [] });
    expect(screen.getByText('Pagina do carrinho')).toBeInTheDocument();
  });

  it('percorre os passos e finaliza o pedido com addressId e paymentMethod', async () => {
    placeOrder.mockResolvedValue({
      orderId: 99,
      orderStatus: 'Order Accepted!',
      totalAmount: 259.9,
      orderItems: [
        {
          orderItemId: 1,
          product: { productName: 'Vestido Midi' },
          size: 'M',
          quantity: 1,
          orderedProductPrice: 259.9,
          sku: 'VESTIDO-MIDI-M',
        },
      ],
    });

    renderCheckout();
    goThroughSteps();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pedido' }));

    await waitFor(() =>
      expect(placeOrder).toHaveBeenCalledWith({ addressId: 1, paymentMethod: 'pix-qr' }),
    );
    expect(await screen.findByText('Pedido realizado!')).toBeInTheDocument();
    expect(screen.getByText(/#99/)).toBeInTheDocument();
  });

  it('mostra os itens sem estoque quando o backend responde 409', async () => {
    placeOrder.mockRejectedValue({
      response: {
        status: 409,
        data: {
          message: 'Sem estoque',
          unavailableItems: [
            { variantId: 7, productName: 'Vestido Midi', size: 'M', requested: 3, available: 1 },
          ],
        },
      },
    });

    renderCheckout();
    goThroughSteps();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pedido' }));

    expect(
      await screen.findByText(/Vestido Midi \(M\) — pedido 3, disponível 1/),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Revisar carrinho' })).toHaveAttribute(
      'href',
      '/carrinho',
    );
  });
});
