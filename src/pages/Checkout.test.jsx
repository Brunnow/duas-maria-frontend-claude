import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { authenticatedAuth, cartState, makeStore } from '@/test/renderWithProviders';

vi.mock('@/services/orderService', () => ({ placeOrder: vi.fn() }));
vi.mock('@/services/shippingService', () => ({ quoteShipping: vi.fn() }));
vi.mock('@/services/couponService', () => ({ validateCoupon: vi.fn() }));
vi.mock('@/services/addressService', () => ({
  getUserAddresses: vi.fn(),
  createAddress: vi.fn(),
  updateAddress: vi.fn(),
  deleteAddress: vi.fn(),
}));

import { getUserAddresses } from '@/services/addressService';

import { placeOrder } from '@/services/orderService';
import { quoteShipping } from '@/services/shippingService';
import { validateCoupon } from '@/services/couponService';
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
  recipientName: 'Maria da Silva',
  phone: '(81) 91234-5678',
  pincode: '50000-000',
  street: 'Rua das Flores',
  number: '123',
  buildingName: 'Apto 1',
  neighborhood: 'Boa Viagem',
  city: 'Recife',
  state: 'PE',
};

function renderCheckout({ items = [ITEM], addresses = [ADDRESS] } = {}) {
  // O mount do Checkout dispara fetchAddresses; devolver a MESMA lista
  // evita que a store seja zerada durante o teste.
  getUserAddresses.mockResolvedValue(addresses);
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

// Endereço -> Frete -> Pagamento -> (Revisão)
const goThroughSteps = async () => {
  fireEvent.click(screen.getByRole('radio', { name: /Rua das Flores/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(await screen.findByText(/R\$\s*14,90/)).toBeInTheDocument(); // frete cotado
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  fireEvent.click(screen.getByRole('radio', { name: /PIX/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
};

beforeEach(() => {
  vi.clearAllMocks();
  quoteShipping.mockResolvedValue({ shippingAmount: 14.9, shippingMethod: 'FIXED_UF' });
});

describe('Checkout', () => {
  it('redireciona para o carrinho quando esta vazio', () => {
    renderCheckout({ items: [] });
    expect(screen.getByText('Pagina do carrinho')).toBeInTheDocument();
  });

  it('cota o frete pela UF do endereco e soma produtos + frete na revisao', async () => {
    renderCheckout();
    await goThroughSteps();

    await waitFor(() => expect(quoteShipping).toHaveBeenCalledWith('PE'));
    // Produtos 259,90 + Frete 14,90 = 274,80
    expect(await screen.findByText(/R\$\s*274,80/)).toBeInTheDocument();
    expect(screen.getByText(/Entrega padrão/)).toBeInTheDocument();
  });

  it('mostra erro de cotacao e permite tentar de novo', async () => {
    quoteShipping.mockRejectedValueOnce({ response: { data: { uf: 'UF inválida' } } });
    renderCheckout();

    fireEvent.click(screen.getByRole('radio', { name: /Rua das Flores/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText('UF inválida')).toBeInTheDocument();
    // Continuar fica desabilitado enquanto o frete nao cotou
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();

    quoteShipping.mockResolvedValueOnce({ shippingAmount: 14.9, shippingMethod: 'FIXED_UF' });
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText(/R\$\s*14,90/)).toBeInTheDocument();
  });

  it('percorre os passos e finaliza o pedido com addressId e paymentMethod', async () => {
    placeOrder.mockResolvedValue({
      orderId: 99,
      orderStatus: 'PAGO',
      totalAmount: 274.8,
      shippingAmount: 14.9,
      shippingMethod: 'FIXED_UF',
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
    await goThroughSteps();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pedido' }));

    await waitFor(() =>
      expect(placeOrder).toHaveBeenCalledWith({
        addressId: 1,
        paymentMethod: 'pix-qr',
        couponCode: undefined,
      }),
    );
    expect(await screen.findByText('Pedido realizado!')).toBeInTheDocument();
    expect(screen.getByText(/#99/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*274,80/)).toBeInTheDocument();
  });

  it('aplica um cupom e envia couponCode no fechamento', async () => {
    validateCoupon.mockResolvedValue({
      code: 'PROMO10',
      discountType: 'PERCENT',
      discountValue: 10,
      discountAmount: 25.99,
      subtotal: 259.9,
      subtotalAfterDiscount: 233.91,
    });
    placeOrder.mockResolvedValue({
      orderId: 5,
      orderStatus: 'PAGO',
      totalAmount: 248.81,
      shippingAmount: 14.9,
      shippingMethod: 'FIXED_UF',
      couponCode: 'PROMO10',
      discountAmount: 25.99,
      orderItems: [],
    });

    renderCheckout();
    await goThroughSteps();

    fireEvent.change(screen.getByLabelText('Cupom de desconto'), { target: { value: 'PROMO10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    // resumo do cupom aplicado no CouponField
    expect(await screen.findByText(/aplicado — desconto de/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pedido' }));

    await waitFor(() =>
      expect(placeOrder).toHaveBeenCalledWith({
        addressId: 1,
        paymentMethod: 'pix-qr',
        couponCode: 'PROMO10',
      }),
    );
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
    await goThroughSteps();
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
