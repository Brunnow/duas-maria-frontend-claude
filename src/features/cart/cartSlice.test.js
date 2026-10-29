import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('@/services/cartService', () => ({
  getCart: vi.fn(),
  addVariantToCart: vi.fn(),
  incrementVariant: vi.fn(),
  decrementVariant: vi.fn(),
  removeVariant: vi.fn(),
}));

import * as cartService from '@/services/cartService';
import authReducer from '@/features/auth/authSlice';
import reducer, {
  addToCart,
  clearCart,
  closeDrawer,
  decrementItem,
  fetchCart,
  incrementItem,
  loadGuestCart,
  mergeGuestCart,
  openDrawer,
  removeItem,
  selectCartCount,
  selectServerCartReady,
} from './cartSlice';

const AUTH = {
  authenticated: { user: { id: 1 }, roles: ['ROLE_USER'], status: 'authenticated' },
  anonymous: { user: null, roles: [], status: 'anonymous' },
};

const makeStore = (auth = 'authenticated') =>
  configureStore({
    reducer: { auth: authReducer, cart: reducer },
    preloadedState: { auth: AUTH[auth] },
  });

const GUEST_KEY = 'dm-guest-cart';
const guestStored = () => JSON.parse(window.localStorage.getItem(GUEST_KEY) || '[]');

const VESTIDO_M = {
  productName: 'Vestido',
  image: 'http://localhost:8080/images/a.jpg',
  color: 'Verde',
  size: 'M',
  unitPrice: 50,
  stock: 3,
};

const CART_DTO = {
  cartId: 1,
  totalPrice: 100,
  items: [
    {
      cartItemId: 9,
      productId: 2,
      variantId: 7,
      productName: 'Vestido',
      size: 'M',
      image: 'a.jpg',
      unitPrice: 50,
      quantity: 2,
      lineTotal: 100,
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('cartSlice reducers', () => {
  it('openDrawer / closeDrawer / clearCart', () => {
    let state = reducer(undefined, openDrawer());
    expect(state.drawerOpen).toBe(true);

    state = reducer(state, closeDrawer());
    expect(state.drawerOpen).toBe(false);

    state = reducer(
      { ...state, items: [{ quantity: 2 }], totalPrice: 100, cartId: 5 },
      clearCart(),
    );
    expect(state.items).toEqual([]);
    expect(state.totalPrice).toBe(0);
    expect(state.cartId).toBeNull();
  });
});

describe('cartSlice thunks', () => {
  it('fetchCart: 404/401 (usuario sem carrinho) resolve como carrinho vazio', async () => {
    for (const code of [404, 401, 500]) {
      cartService.getCart.mockRejectedValue({ response: { status: code } });
      const store = makeStore();
      await store.dispatch(fetchCart());
      expect(store.getState().cart.items).toEqual([]);
      expect(store.getState().cart.status).toBe('ready');
    }
  });

  it('addToCart: sucesso aplica o CartDTO, prefixa a imagem e conta os itens', async () => {
    cartService.addVariantToCart.mockResolvedValue(CART_DTO);
    const store = makeStore();
    await store.dispatch(addToCart({ productId: 2, variantId: 7, quantity: 2 })).unwrap();
    const cart = store.getState().cart;
    expect(cart.items[0].image).toMatch(/\/images\/a\.jpg$/);
    expect(selectCartCount({ cart })).toBe(2);
  });

  it('addToCart: 400 "já está no carrinho" rejeita com code already_in_cart', async () => {
    cartService.addVariantToCart.mockRejectedValue({
      response: { status: 400, data: { message: 'A variação X já está no carrinho.' } },
    });
    const res = await makeStore().dispatch(addToCart({ productId: 2, variantId: 7 }));
    expect(res.payload).toEqual({ code: 'already_in_cart' });
  });

  it('addToCart: erro de estoque grava a mensagem do backend em opError', async () => {
    cartService.addVariantToCart.mockRejectedValue({
      response: { status: 400, data: { message: 'Vestido (M) está esgotado.' } },
    });
    const store = makeStore();
    await store.dispatch(addToCart({ productId: 2, variantId: 7 }));
    expect(store.getState().cart.opError).toBe('Vestido (M) está esgotado.');
  });

  it('addToCart: 401 (sessao caiu) guarda a peca no carrinho do visitante', async () => {
    cartService.addVariantToCart.mockRejectedValue({ response: { status: 401 } });
    const store = makeStore();
    await store
      .dispatch(addToCart({ productId: 2, variantId: 7, quantity: 1, item: VESTIDO_M }))
      .unwrap();
    expect(guestStored()).toHaveLength(1);
    expect(store.getState().cart.owner).toBe('guest');
  });

  it('incrementItem: estoque insuficiente -> opError', async () => {
    cartService.incrementVariant.mockRejectedValue({
      response: {
        data: { message: 'Estoque insuficiente para SKU-X: disponível 1, solicitado 2.' },
      },
    });
    const store = makeStore();
    await store.dispatch(incrementItem(7));
    expect(store.getState().cart.opError).toMatch(/estoque insuficiente/i);
  });

  it('removeItem: chama DELETE e recarrega o carrinho', async () => {
    cartService.removeVariant.mockResolvedValue('removido');
    cartService.getCart.mockResolvedValue({ cartId: 1, totalPrice: 0, items: [] });
    const store = makeStore();
    await store.dispatch(removeItem({ cartId: 1, variantId: 7 }));
    expect(cartService.removeVariant).toHaveBeenCalledWith(1, 7);
    expect(store.getState().cart.items).toEqual([]);
  });
});

describe('carrinho do visitante', () => {
  it('add sem login: guarda no navegador, sem chamar a API, e conta os itens', async () => {
    const store = makeStore('anonymous');
    await store
      .dispatch(addToCart({ productId: 2, variantId: 7, quantity: 2, item: VESTIDO_M }))
      .unwrap();

    expect(cartService.addVariantToCart).not.toHaveBeenCalled();
    expect(guestStored()).toEqual([{ ...VESTIDO_M, productId: 2, variantId: 7, quantity: 2 }]);
    const cart = store.getState().cart;
    expect(cart.owner).toBe('guest');
    expect(cart.totalPrice).toBe(100);
    expect(cart.items[0]).toMatchObject({
      variantId: 7,
      size: 'M',
      color: 'Verde',
      lineTotal: 100,
    });
    expect(selectCartCount({ cart })).toBe(2);
    expect(selectServerCartReady({ cart })).toBe(false);
  });

  it('add sem login: mesmo tamanho de novo nao duplica; acima do estoque e recusado', async () => {
    const store = makeStore('anonymous');
    await store.dispatch(addToCart({ productId: 2, variantId: 7, quantity: 1, item: VESTIDO_M }));

    const again = await store.dispatch(
      addToCart({ productId: 2, variantId: 7, quantity: 1, item: VESTIDO_M }),
    );
    expect(again.payload).toEqual({ code: 'already_in_cart' });

    const tooMany = await store.dispatch(
      addToCart({ productId: 2, variantId: 8, quantity: 4, item: { ...VESTIDO_M, size: 'G' } }),
    );
    expect(tooMany.payload.code).toBe('stock');
    expect(guestStored()).toHaveLength(1);
  });

  it('+1, -1 e remover no carrinho do visitante; +1 para no estoque', async () => {
    const store = makeStore('anonymous');
    await store.dispatch(addToCart({ productId: 2, variantId: 7, quantity: 2, item: VESTIDO_M }));

    await store.dispatch(incrementItem(7));
    expect(guestStored()[0].quantity).toBe(3);
    await store.dispatch(incrementItem(7));
    expect(guestStored()[0].quantity).toBe(3);
    expect(store.getState().cart.opError).toMatch(/só temos 3 unidades/);

    await store.dispatch(decrementItem(7));
    expect(store.getState().cart.items[0].quantity).toBe(2);

    await store.dispatch(removeItem({ cartId: null, variantId: 7 }));
    expect(store.getState().cart.items).toEqual([]);
    expect(window.localStorage.getItem(GUEST_KEY)).toBeNull();
    expect(cartService.incrementVariant).not.toHaveBeenCalled();
    expect(cartService.removeVariant).not.toHaveBeenCalled();
  });

  it('loadGuestCart mostra o que ficou guardado (ex.: depois de um F5)', () => {
    window.localStorage.setItem(
      GUEST_KEY,
      JSON.stringify([{ ...VESTIDO_M, productId: 2, variantId: 7, quantity: 1 }]),
    );
    const state = reducer(undefined, loadGuestCart());
    expect(state.owner).toBe('guest');
    expect(state.status).toBe('ready');
    expect(state.items).toHaveLength(1);
  });
});

describe('mergeGuestCart (depois do login)', () => {
  const guest = (variantId, quantity) => ({ ...VESTIDO_M, productId: 2, variantId, quantity });
  const serverLine = (variantId, quantity) => ({
    cartItemId: variantId * 10,
    productId: 2,
    variantId,
    productName: 'Vestido',
    size: 'M',
    image: 'a.jpg',
    unitPrice: 50,
    quantity,
    lineTotal: 50 * quantity,
  });

  it('manda os itens novos para o backend e nao duplica o que ja estava la', async () => {
    window.localStorage.setItem(GUEST_KEY, JSON.stringify([guest(7, 3), guest(8, 1)]));
    cartService.getCart.mockResolvedValue({ cartId: 1, totalPrice: 50, items: [serverLine(7, 1)] });
    cartService.incrementVariant
      .mockResolvedValueOnce({ cartId: 1, items: [serverLine(7, 2)] })
      .mockResolvedValueOnce({ cartId: 1, items: [serverLine(7, 3)] });
    cartService.addVariantToCart.mockResolvedValue({
      cartId: 1,
      totalPrice: 200,
      items: [serverLine(7, 3), serverLine(8, 1)],
    });

    const store = makeStore();
    await store.dispatch(mergeGuestCart()).unwrap();

    // variante 7 ja estava no servidor com 1: sobe ate 3 (+1, +1), sem novo POST
    expect(cartService.incrementVariant).toHaveBeenCalledTimes(2);
    expect(cartService.incrementVariant).toHaveBeenCalledWith(7);
    expect(cartService.addVariantToCart).toHaveBeenCalledTimes(1);
    expect(cartService.addVariantToCart).toHaveBeenCalledWith(2, 8, 1);

    const cart = store.getState().cart;
    expect(cart.owner).toBe('user');
    expect(cart.cartId).toBe(1);
    expect(cart.items.map((i) => [i.variantId, i.quantity])).toEqual([
      [7, 3],
      [8, 1],
    ]);
    expect(selectServerCartReady({ cart })).toBe(true);
    expect(window.localStorage.getItem(GUEST_KEY)).toBeNull();
  });

  it('servidor com quantidade maior fica como esta; sem carrinho de visitante so carrega', async () => {
    window.localStorage.setItem(GUEST_KEY, JSON.stringify([guest(7, 1)]));
    cartService.getCart.mockResolvedValue({ cartId: 1, items: [serverLine(7, 2)] });
    const store = makeStore();
    await store.dispatch(mergeGuestCart());
    expect(cartService.incrementVariant).not.toHaveBeenCalled();
    expect(cartService.addVariantToCart).not.toHaveBeenCalled();
    expect(store.getState().cart.items[0].quantity).toBe(2);

    await store.dispatch(mergeGuestCart());
    expect(cartService.getCart).toHaveBeenCalledTimes(2);
  });

  it('item recusado pelo backend (esgotou) fica de fora com aviso', async () => {
    window.localStorage.setItem(GUEST_KEY, JSON.stringify([guest(7, 1), guest(8, 1)]));
    cartService.getCart
      .mockRejectedValueOnce({ response: { status: 404 } }) // ainda sem carrinho
      .mockResolvedValue({ cartId: 1, items: [serverLine(8, 1)] });
    cartService.addVariantToCart
      .mockRejectedValueOnce({ response: { status: 400, data: { message: 'esgotado' } } })
      .mockResolvedValueOnce({ cartId: 1, items: [serverLine(8, 1)] });

    const store = makeStore();
    await store.dispatch(mergeGuestCart());

    const cart = store.getState().cart;
    expect(cart.items.map((i) => i.variantId)).toEqual([8]);
    expect(cart.opError).toMatch(/esgotaram/);
    expect(window.localStorage.getItem(GUEST_KEY)).toBeNull();
  });

  it('falha de rede antes de juntar: o carrinho do visitante continua guardado', async () => {
    window.localStorage.setItem(GUEST_KEY, JSON.stringify([guest(7, 1)]));
    cartService.getCart.mockRejectedValue(new Error('Network Error'));
    const store = makeStore();
    await store.dispatch(mergeGuestCart());
    expect(store.getState().cart.status).toBe('error');
    expect(guestStored()).toHaveLength(1);
  });
});
