import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { authenticatedAuth, cartState, makeStore } from '@/test/renderWithProviders';

vi.mock('@/services/orderService', () => ({
  createOrder: vi.fn(),
  startMercadoPagoPayment: vi.fn(),
}));
vi.mock('@/services/shippingService', () => ({ getShippingOptions: vi.fn() }));
vi.mock('@/services/couponService', () => ({ validateCoupon: vi.fn() }));
vi.mock('@/services/addressService', () => ({
  getUserAddresses: vi.fn(),
  createAddress: vi.fn(),
  updateAddress: vi.fn(),
  deleteAddress: vi.fn(),
}));
vi.mock('@/lib/navigate', () => ({ goToExternal: vi.fn() }));
vi.mock('@/lib/pixel', async (importOriginal) => ({ ...(await importOriginal()), track: vi.fn() }));

import { getUserAddresses } from '@/services/addressService';

import { createOrder, startMercadoPagoPayment } from '@/services/orderService';
import { getShippingOptions } from '@/services/shippingService';
import { validateCoupon } from '@/services/couponService';
import { goToExternal } from '@/lib/navigate';
import { track } from '@/lib/pixel';
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

function renderCheckout({ items = [ITEM], addresses = [ADDRESS], cart = {} } = {}) {
  // O mount do Checkout dispara fetchAddresses; devolver a MESMA lista
  // evita que a store seja zerada durante o teste.
  getUserAddresses.mockResolvedValue(addresses);
  const store = makeStore({
    ...authenticatedAuth,
    ...cartState(items, cart),
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

// Endereço -> Frete -> Revisão (sem passo de pagamento: a escolha é no Mercado Pago)
const goThroughSteps = async () => {
  fireEvent.click(screen.getByRole('radio', { name: /Rua das Flores/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(await screen.findByText(/R\$\s*14,90/)).toBeInTheDocument(); // frete cotado
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
};

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
  getShippingOptions.mockResolvedValue([
    {
      serviceId: 'FIXED_UF',
      carrierName: null,
      serviceName: 'Entrega padrão',
      price: 14.9,
      deliveryDays: null,
    },
  ]);
});

describe('Checkout', () => {
  it('redireciona para o carrinho quando esta vazio', () => {
    renderCheckout({ items: [] });
    expect(screen.getByText('Pagina do carrinho')).toBeInTheDocument();
  });

  it('logo depois do login espera o carrinho do visitante entrar na conta', async () => {
    // Ainda o carrinho do navegador (vazio para o servidor): nao pode mandar
    // de volta para /carrinho; quando o merge termina, segue o checkout.
    const store = renderCheckout({ items: [], cart: { owner: 'guest', status: 'loading' } });
    expect(screen.queryByText('Pagina do carrinho')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Continuar' })).toBeNull();

    store.dispatch({
      type: 'cart/mergeGuest/fulfilled',
      payload: { cart: { cartId: 1, totalPrice: 199.9, items: [ITEM] }, skipped: 0 },
    });

    expect(await screen.findByRole('button', { name: 'Continuar' })).toBeInTheDocument();
    expect(screen.queryByText('Pagina do carrinho')).toBeNull();
  });

  it('com um unico endereco, ele ja vem escolhido e o Continuar fica ativo', async () => {
    renderCheckout();
    expect(await screen.findByRole('radio', { name: /Rua das Flores/ })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  });

  it('com mais de um endereco, pede para escolher', async () => {
    renderCheckout({ addresses: [ADDRESS, { ...ADDRESS, addressId: 2, street: 'Rua Nova' }] });
    await screen.findByRole('radio', { name: /Rua Nova/ });
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();

    fireEvent.click(screen.getByRole('radio', { name: /Rua Nova/ }));
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  });

  it('cota o frete pelo CEP/UF do endereco e soma produtos + frete na revisao', async () => {
    renderCheckout();
    await goThroughSteps();

    await waitFor(() =>
      expect(getShippingOptions).toHaveBeenCalledWith({ cep: '50000-000', uf: 'PE' }),
    );
    // Produtos 259,90 + Frete 14,90 = 274,80
    expect(await screen.findByText(/R\$\s*274,80/)).toBeInTheDocument();
    expect(screen.getByText(/Entrega padrão/)).toBeInTheDocument();
  });

  it('opcao com frete gratis mostra o preco original riscado e soma zero na revisao', async () => {
    getShippingOptions.mockResolvedValueOnce([
      {
        serviceId: '1',
        carrierName: 'Correios',
        serviceName: 'PAC',
        price: 0,
        deliveryDays: 7,
        freeShipping: true,
        originalPrice: 27.6,
      },
    ]);
    renderCheckout();

    fireEvent.click(screen.getByRole('radio', { name: /Rua das Flores/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText(/R\$\s*27,60/)).toHaveClass('line-through');
    expect(screen.getByText('Grátis')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    // revisao: frete "Gratis" e total = so os produtos (259,90)
    expect(await screen.findByText(/Correios · PAC/)).toBeInTheDocument();
    expect(screen.getByText('Grátis')).toBeInTheDocument();
    expect(screen.getAllByText(/R\$\s*259,90/).length).toBeGreaterThanOrEqual(2);
  });

  it('entrega local mostra "Gratis" e o aviso de que a loja combina pelo WhatsApp', async () => {
    getShippingOptions.mockResolvedValueOnce([
      {
        serviceId: 'LOCAL_DELIVERY',
        carrierName: null,
        serviceName: 'Entrega local',
        price: 0,
        deliveryDays: null,
        freeShipping: false,
        originalPrice: null,
      },
    ]);
    renderCheckout();

    fireEvent.click(screen.getByRole('radio', { name: /Rua das Flores/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText('Entrega local')).toBeInTheDocument();
    expect(screen.getByText('Grátis')).toBeInTheDocument();
    expect(screen.getByText(/combina o horário com você pelo WhatsApp/)).toBeInTheDocument();
    expect(screen.queryByText(/R\$\s*0,00/)).not.toBeInTheDocument();
  });

  it('SEDEX com desconto do frete gratis mostra preco cheio riscado e cobra a diferenca', async () => {
    getShippingOptions.mockResolvedValueOnce([
      {
        serviceId: '1',
        carrierName: 'Correios',
        serviceName: 'PAC',
        price: 0,
        deliveryDays: 7,
        freeShipping: true,
        originalPrice: 27.6,
      },
      {
        serviceId: '2',
        carrierName: 'Correios',
        serviceName: 'SEDEX',
        price: 34.72,
        deliveryDays: 3,
        freeShipping: false,
        originalPrice: 62.32,
      },
    ]);
    renderCheckout();

    fireEvent.click(screen.getByRole('radio', { name: /Rua das Flores/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText(/R\$\s*62,32/)).toHaveClass('line-through');
    expect(screen.getByText(/R\$\s*34,72/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: /SEDEX/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    // Produtos 259,90 + SEDEX com desconto 34,72 = 294,62
    expect(await screen.findByText(/R\$\s*294,62/)).toBeInTheDocument();
  });

  it('mostra multiplas opcoes de frete e deixa o cliente trocar', async () => {
    getShippingOptions.mockResolvedValueOnce([
      { serviceId: '1', carrierName: 'Correios', serviceName: 'PAC', price: 27.6, deliveryDays: 7 },
      {
        serviceId: '2',
        carrierName: 'Correios',
        serviceName: 'SEDEX',
        price: 62.32,
        deliveryDays: 3,
      },
    ]);
    renderCheckout();

    fireEvent.click(screen.getByRole('radio', { name: /Rua das Flores/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText(/R\$\s*27,60/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*62,32/)).toBeInTheDocument();

    // pré-seleciona a primeira opção (PAC); troca pra SEDEX e segue pra revisão
    fireEvent.click(screen.getByRole('radio', { name: /SEDEX/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText(/Correios · SEDEX/)).toBeInTheDocument();
  });

  it('mostra erro de cotacao e permite tentar de novo', async () => {
    getShippingOptions.mockRejectedValueOnce({ response: { data: { uf: 'UF inválida' } } });
    renderCheckout();

    fireEvent.click(screen.getByRole('radio', { name: /Rua das Flores/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText('UF inválida')).toBeInTheDocument();
    // Continuar fica desabilitado enquanto o frete nao cotou
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();

    getShippingOptions.mockResolvedValueOnce([
      {
        serviceId: 'FIXED_UF',
        carrierName: null,
        serviceName: 'Entrega padrão',
        price: 14.9,
        deliveryDays: null,
      },
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText(/R\$\s*14,90/)).toBeInTheDocument();
  });

  it('cria o pedido e redireciona ao Mercado Pago', async () => {
    createOrder.mockResolvedValue({
      order: { orderId: 99, orderStatus: 'AGUARDANDO_PAGAMENTO', paymentStatus: 'PENDING' },
      initPoint: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=abc',
      paymentInitFailed: false,
    });

    renderCheckout();
    await goThroughSteps();
    fireEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));

    await waitFor(() =>
      expect(createOrder).toHaveBeenCalledWith({
        addressId: 1,
        couponCodes: [],
        shippingServiceId: 'FIXED_UF',
      }),
    );
    await waitFor(() =>
      expect(goToExternal).toHaveBeenCalledWith(
        'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=abc',
      ),
    );
  });

  it('aplica um cupom e envia couponCode na criacao do pedido', async () => {
    validateCoupon.mockResolvedValue({
      code: 'PROMO10',
      discountType: 'PERCENT',
      discountValue: 10,
      discountAmount: 25.99,
      subtotal: 259.9,
      subtotalAfterDiscount: 233.91,
    });
    createOrder.mockResolvedValue({
      order: { orderId: 5, orderStatus: 'AGUARDANDO_PAGAMENTO', paymentStatus: 'PENDING' },
      initPoint: 'https://mp/redirect',
      paymentInitFailed: false,
    });

    renderCheckout();
    await goThroughSteps();

    fireEvent.change(screen.getByLabelText('Cupom de desconto'), { target: { value: 'PROMO10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    // resumo do cupom aplicado no CouponField
    expect(await screen.findByText(/aplicado — desconto de/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));

    await waitFor(() =>
      expect(createOrder).toHaveBeenCalledWith({
        addressId: 1,
        couponCodes: ['PROMO10'],
        shippingServiceId: 'FIXED_UF',
      }),
    );
  });

  it('aplica dois cupons combinaveis: soma o desconto e envia os dois codigos', async () => {
    validateCoupon
      .mockResolvedValueOnce({
        code: 'ESQUENTA20',
        discountAmount: 51.98,
        totalDiscountAmount: 51.98,
        coupons: [{ code: 'ESQUENTA20', discountAmount: 51.98 }],
      })
      .mockResolvedValueOnce({
        code: 'PRIMEIRACOMPRA',
        discountAmount: 25.99,
        totalDiscountAmount: 77.97,
        coupons: [
          { code: 'ESQUENTA20', discountAmount: 51.98 },
          { code: 'PRIMEIRACOMPRA', discountAmount: 25.99 },
        ],
      });
    createOrder.mockResolvedValue({
      order: { orderId: 6, orderStatus: 'AGUARDANDO_PAGAMENTO', paymentStatus: 'PENDING' },
      initPoint: 'https://mp/redirect',
      paymentInitFailed: false,
    });

    renderCheckout();
    await goThroughSteps();

    fireEvent.change(screen.getByLabelText('Cupom de desconto'), {
      target: { value: 'ESQUENTA20' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    fireEvent.change(await screen.findByLabelText('Tem outro cupom?'), {
      target: { value: 'PRIMEIRACOMPRA' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    await waitFor(() =>
      expect(validateCoupon).toHaveBeenLastCalledWith('PRIMEIRACOMPRA', ['ESQUENTA20']),
    );
    expect(await screen.findByText('Desconto · ESQUENTA20 + PRIMEIRACOMPRA')).toBeInTheDocument();
    // 259,90 - 77,97 + 14,90 de frete = 196,83
    expect(screen.getByText(/R\$\s*196,83/)).toBeInTheDocument();
    // com 2 cupons nao ha campo para um terceiro
    expect(screen.queryByLabelText('Tem outro cupom?')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));
    await waitFor(() =>
      expect(createOrder).toHaveBeenCalledWith({
        addressId: 1,
        couponCodes: ['ESQUENTA20', 'PRIMEIRACOMPRA'],
        shippingServiceId: 'FIXED_UF',
      }),
    );
  });

  it('mostra os itens sem estoque quando o backend responde 409', async () => {
    createOrder.mockRejectedValue({
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
    fireEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));

    expect(
      await screen.findByText(/Vestido Midi \(M\) — pedido 3, disponível 1/),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Revisar carrinho' })).toHaveAttribute(
      'href',
      '/carrinho',
    );
  });

  it('quando a preference falha, mostra o pedido criado com opcao de tentar de novo', async () => {
    createOrder.mockResolvedValue({
      order: { orderId: 42, orderStatus: 'AGUARDANDO_PAGAMENTO', paymentStatus: 'PENDING' },
      initPoint: null,
      paymentInitFailed: true,
    });

    renderCheckout();
    await goThroughSteps();
    fireEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));

    expect(await screen.findByText(/#42/)).toBeInTheDocument();
    expect(screen.getByText(/não foi possível iniciar o pagamento agora/)).toBeInTheDocument();

    startMercadoPagoPayment.mockResolvedValue({
      preferenceId: 'p1',
      initPoint: 'https://mp/retry',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar pagamento' }));

    await waitFor(() => expect(startMercadoPagoPayment).toHaveBeenCalledWith(42));
    await waitFor(() => expect(goToExternal).toHaveBeenCalledWith('https://mp/retry'));
  });
});

describe('Checkout: eventos do Pixel', () => {
  const calls = (event) => track.mock.calls.filter(([name]) => name === event);
  const CART_PARAMS = {
    content_type: 'product',
    content_ids: ['2'],
    value: 259.9,
    currency: 'BRL',
    num_items: 1,
  };
  const ORDER_OK = {
    order: { orderId: 99, orderStatus: 'AGUARDANDO_PAGAMENTO', paymentStatus: 'PENDING' },
    initPoint: 'https://mp/pay',
    paymentInitFailed: false,
  };
  const pay = () => fireEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));

  it('InitiateCheckout dispara uma vez ao abrir o checkout, com o carrinho pronto', async () => {
    renderCheckout();
    await screen.findByRole('button', { name: 'Continuar' });

    expect(calls('InitiateCheckout')).toEqual([['InitiateCheckout', CART_PARAMS]]);
    // re-renders (passos, frete cotado) nao repetem
    await goThroughSteps();
    expect(calls('InitiateCheckout')).toHaveLength(1);
  });

  it('nao dispara enquanto o carrinho do visitante ainda esta indo para a conta', () => {
    renderCheckout({ items: [], cart: { owner: 'guest', status: 'loading' } });
    expect(calls('InitiateCheckout')).toHaveLength(0);
  });

  it('voltar ao checkout (F5, volta do Mercado Pago) com o mesmo carrinho nao repete', async () => {
    renderCheckout();
    await screen.findByRole('button', { name: 'Continuar' });
    cleanup();

    renderCheckout();
    await screen.findByRole('button', { name: 'Continuar' });

    expect(calls('InitiateCheckout')).toHaveLength(1);
  });

  it('carrinho mudou de verdade (quantidade) = novo InitiateCheckout', async () => {
    const store = renderCheckout();
    await screen.findByRole('button', { name: 'Continuar' });

    act(() => {
      store.dispatch({
        type: 'cart/increment/fulfilled',
        payload: {
          owner: 'user',
          cart: { cartId: 1, items: [{ ...ITEM, quantity: 2, lineTotal: 519.8 }] },
        },
      });
    });

    await waitFor(() => expect(calls('InitiateCheckout')).toHaveLength(2));
    expect(calls('InitiateCheckout')[1][1]).toMatchObject({ value: 519.8, num_items: 2 });
  });

  it('clicar em pagar nao dispara InitiateCheckout; AddPaymentInfo so depois do pedido criado', async () => {
    let resolveOrder;
    createOrder.mockReturnValue(
      new Promise((resolve) => {
        resolveOrder = resolve;
      }),
    );
    renderCheckout();
    await goThroughSteps();
    pay();

    // pedido ainda sendo criado: nada alem do InitiateCheckout da abertura
    await waitFor(() => expect(createOrder).toHaveBeenCalled());
    expect(calls('AddPaymentInfo')).toHaveLength(0);
    expect(calls('InitiateCheckout')).toHaveLength(1);

    await act(async () => resolveOrder(ORDER_OK));

    await waitFor(() => expect(goToExternal).toHaveBeenCalledWith('https://mp/pay'));
    expect(calls('AddPaymentInfo')).toEqual([['AddPaymentInfo', CART_PARAMS]]);
    expect(calls('InitiateCheckout')).toHaveLength(1);
  });

  it('AddPaymentInfo leva o desconto dos cupons no value', async () => {
    validateCoupon.mockResolvedValue({
      code: 'PROMO10',
      discountType: 'PERCENT',
      discountValue: 10,
      discountAmount: 25.99,
      subtotal: 259.9,
      subtotalAfterDiscount: 233.91,
    });
    createOrder.mockResolvedValue(ORDER_OK);
    renderCheckout();
    await goThroughSteps();
    fireEvent.change(screen.getByLabelText('Cupom de desconto'), { target: { value: 'PROMO10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    expect(await screen.findByText(/aplicado — desconto de/)).toBeInTheDocument();
    pay();

    await waitFor(() => expect(calls('AddPaymentInfo')).toHaveLength(1));
    expect(calls('AddPaymentInfo')[0][1].value).toBe(233.91);
  });

  it('erro ao criar o pedido (409, 400, rede) e nova tentativa: sem AddPaymentInfo e sem repetir InitiateCheckout', async () => {
    createOrder
      .mockRejectedValueOnce({
        response: { status: 409, data: { message: 'Sem estoque', unavailableItems: [] } },
      })
      .mockRejectedValueOnce({ response: { status: 400, data: { message: 'Cupom expirado.' } } })
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce(ORDER_OK);
    renderCheckout();
    await goThroughSteps();

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      pay();
      await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(attempt));
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Ir para o pagamento' })).not.toBeDisabled(),
      );
    }
    expect(calls('AddPaymentInfo')).toHaveLength(0);
    expect(goToExternal).not.toHaveBeenCalled();

    pay(); // a quarta da certo
    await waitFor(() => expect(goToExternal).toHaveBeenCalledWith('https://mp/pay'));
    expect(calls('AddPaymentInfo')).toHaveLength(1);
    expect(calls('InitiateCheckout')).toHaveLength(1);
  });

  it('pedido criado mas o Mercado Pago falhou: AddPaymentInfo so quando o retry abre o pagamento', async () => {
    createOrder.mockResolvedValue({
      order: { orderId: 42, orderStatus: 'AGUARDANDO_PAGAMENTO', paymentStatus: 'PENDING' },
      initPoint: null,
      paymentInitFailed: true,
    });
    startMercadoPagoPayment
      .mockRejectedValueOnce(new Error('MP fora'))
      .mockResolvedValueOnce({ preferenceId: 'p1', initPoint: 'https://mp/retry' });
    renderCheckout();
    await goThroughSteps();
    pay();
    await screen.findByText(/#42/);
    expect(calls('AddPaymentInfo')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar pagamento' }));
    expect(await screen.findByText(/Ainda não foi possível iniciar/)).toBeInTheDocument();
    expect(calls('AddPaymentInfo')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar pagamento' }));
    await waitFor(() => expect(goToExternal).toHaveBeenCalledWith('https://mp/retry'));
    expect(calls('AddPaymentInfo')).toHaveLength(1);
    expect(calls('InitiateCheckout')).toHaveLength(1);
  });
});
