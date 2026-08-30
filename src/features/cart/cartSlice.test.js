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
import reducer, {
  addToCart,
  clearCart,
  closeDrawer,
  fetchCart,
  incrementItem,
  openDrawer,
  removeItem,
  selectCartCount,
} from './cartSlice';

const makeStore = () => configureStore({ reducer: { cart: reducer } });

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

beforeEach(() => vi.clearAllMocks());

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
  it('fetchCart: 404 (usuario sem carrinho) resolve como carrinho vazio', async () => {
    cartService.getCart.mockRejectedValue({ response: { status: 404 } });
    const store = makeStore();
    await store.dispatch(fetchCart());
    expect(store.getState().cart.items).toEqual([]);
    expect(store.getState().cart.status).toBe('ready');
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

  it('addToCart: 401 rejeita com code unauthorized', async () => {
    cartService.addVariantToCart.mockRejectedValue({ response: { status: 401 } });
    const res = await makeStore().dispatch(addToCart({ productId: 2, variantId: 7 }));
    expect(res.payload).toEqual({ code: 'unauthorized' });
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
