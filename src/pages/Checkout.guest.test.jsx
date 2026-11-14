import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { anonymousAuth, cartState, makeStore } from '@/test/renderWithProviders';

vi.mock('@/services/guestCheckoutService', () => ({
  getGuestShippingOptions: vi.fn(),
  validateGuestCoupon: vi.fn(),
  createGuestOrder: vi.fn(),
  startGuestPayment: vi.fn(),
  recordCheckoutLead: vi.fn(() => Promise.resolve()),
}));
vi.mock('@/services/viaCep', () => ({
  lookupCep: vi.fn(() => Promise.reject({ kind: 'notFound' })),
}));
vi.mock('@/lib/navigate', () => ({ goToExternal: vi.fn() }));
vi.mock('@/lib/pixel', async (importOriginal) => ({ ...(await importOriginal()), track: vi.fn() }));

import {
  createGuestOrder,
  recordCheckoutLead,
  getGuestShippingOptions,
  startGuestPayment,
  validateGuestCoupon,
} from '@/services/guestCheckoutService';
import { goToExternal } from '@/lib/navigate';
import { track } from '@/lib/pixel';
import { guestOrderToken } from '@/lib/guestOrders';
import Checkout from './Checkout';

const ITEM = {
  cartItemId: 'guest-7',
  productId: 2,
  variantId: 7,
  productName: 'Vestido Midi',
  size: 'M',
  color: '',
  image: 'http://x/a.jpg',
  unitPrice: 259.9,
  quantity: 1,
  lineTotal: 259.9,
};

function renderGuestCheckout(items = [ITEM]) {
  const store = makeStore({
    ...anonymousAuth,
    ...cartState(items, { owner: 'guest', cartId: null }),
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/checkout']}>
        <Routes>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/carrinho" element={<div>Pagina do carrinho</div>} />
          <Route path="/login" element={<div>Pagina de login</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
}

const type = (label, value) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

function fillContactAndAddress({ email = 'maria@exemplo.com' } = {}) {
  type('E-mail', email);
  type('Nome de quem vai receber', 'Maria da Silva');
  type('WhatsApp', '(81) 91234-5678');
  type('CEP', '50000-000');
  type('Logradouro', 'Rua das Flores');
  type('Número', '123');
  type('CPF de quem vai receber', '52998224725');
  type('Bairro', 'Boa Vista');
  type('Cidade', 'Recife');
  type('UF', 'PE');
}

async function goToReview() {
  fillContactAndAddress();
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(await screen.findByText(/R\$\s*14,90/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(await screen.findByText('maria@exemplo.com')).toBeInTheDocument();
}

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
  window.localStorage.clear();
  getGuestShippingOptions.mockResolvedValue([
    { serviceId: 'FIXED_UF', carrierName: null, serviceName: 'Entrega padrão', price: 14.9 },
  ]);
});

describe('Checkout sem cadastro', () => {
  it('não manda mais para o login: pede os dados e oferece entrar para quem tem conta', () => {
    renderGuestCheckout();
    expect(screen.queryByText('Pagina de login')).toBeNull();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
  });

  it('carrinho vazio volta para o carrinho', () => {
    renderGuestCheckout([]);
    expect(screen.getByText('Pagina do carrinho')).toBeInTheDocument();
  });

  it('InitiateCheckout dispara também para quem compra sem cadastro', () => {
    renderGuestCheckout();
    expect(track).toHaveBeenCalledWith(
      'InitiateCheckout',
      expect.objectContaining({ content_ids: ['2'], value: 259.9, num_items: 1 }),
    );
  });

  it('e-mail inválido segura no primeiro passo', async () => {
    renderGuestCheckout();
    fillContactAndAddress({ email: 'maria@' });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByText('E-mail inválido')).toBeInTheDocument();
    expect(getGuestShippingOptions).not.toHaveBeenCalled();
  });

  it('cria o pedido sem conta, guarda o link do pedido e vai para o Mercado Pago', async () => {
    createGuestOrder.mockResolvedValue({
      order: { orderId: 88 },
      initPoint: 'https://mp/88',
      paymentInitFailed: false,
      accessToken: 'tok-88',
    });
    renderGuestCheckout();
    await goToReview();

    expect(getGuestShippingOptions).toHaveBeenCalledWith({
      cep: '50000-000',
      uf: 'PE',
      items: [ITEM],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));

    await waitFor(() => expect(goToExternal).toHaveBeenCalledWith('https://mp/88'));
    const request = createGuestOrder.mock.calls[0][0];
    expect(request).toMatchObject({
      email: 'maria@exemplo.com',
      items: [ITEM],
      shippingServiceId: 'FIXED_UF',
      couponCodes: [],
      website: '',
    });
    expect(request.address).toMatchObject({
      recipientName: 'Maria da Silva',
      phone: '(81) 91234-5678',
      document: '529.982.247-25',
      pincode: '50000-000',
      state: 'PE',
    });
    expect(request.idempotencyKey).toMatch(/^[A-Za-z0-9-]{16,64}$/);
    expect(guestOrderToken(88)).toBe('tok-88');
    expect(track).toHaveBeenCalledWith('AddPaymentInfo', expect.objectContaining({ value: 259.9 }));
  });

  it('cupom é validado com o e-mail e o CPF digitados', async () => {
    validateGuestCoupon.mockResolvedValue({ code: 'PRIMEIRACOMPRA', discountAmount: 26 });
    renderGuestCheckout();
    await goToReview();

    type('Cupom de desconto', 'primeiracompra');
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(await screen.findByText(/aplicado — desconto de/)).toBeInTheDocument();
    expect(validateGuestCoupon).toHaveBeenCalledWith('primeiracompra', [], {
      email: 'maria@exemplo.com',
      document: '529.982.247-25',
      items: [ITEM],
    });
  });

  it('o mesmo pedido reenviado usa o mesmo id; Mercado Pago fora do ar permite tentar de novo', async () => {
    createGuestOrder.mockResolvedValue({
      order: { orderId: 88 },
      initPoint: null,
      paymentInitFailed: true,
      accessToken: 'tok-88',
    });
    startGuestPayment.mockResolvedValue({ initPoint: 'https://mp/88-retry' });
    renderGuestCheckout();
    await goToReview();

    fireEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Iniciar pagamento' }));

    await waitFor(() => expect(goToExternal).toHaveBeenCalledWith('https://mp/88-retry'));
    expect(startGuestPayment).toHaveBeenCalledWith(88, 'tok-88');
  });

  it('erro do backend aparece para a cliente (ex.: cupom já usado)', async () => {
    createGuestOrder.mockRejectedValue({
      response: {
        status: 409,
        data: { message: 'Este cupom já foi usado com este e-mail ou CPF.' },
      },
    });
    renderGuestCheckout();
    await goToReview();

    fireEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Este cupom já foi usado');
    expect(goToExternal).not.toHaveBeenCalled();
  });
  it('registra o checkout iniciado assim que nome, e-mail e WhatsApp estão preenchidos', async () => {
    renderGuestCheckout();
    type('E-mail', 'maria@exemplo.com');
    type('Nome de quem vai receber', 'Maria da Silva');
    expect(recordCheckoutLead).not.toHaveBeenCalled();
    type('WhatsApp', '(81) 91234-5678');

    await waitFor(() => expect(recordCheckoutLead).toHaveBeenCalledTimes(1), { timeout: 3000 });
    expect(recordCheckoutLead).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Maria da Silva',
        email: 'maria@exemplo.com',
        phone: '(81) 91234-5678',
        items: [ITEM],
      }),
    );
    expect(recordCheckoutLead.mock.calls[0][0].leadKey).toMatch(/^[A-Za-z0-9-]{16,64}$/);
  });
});
