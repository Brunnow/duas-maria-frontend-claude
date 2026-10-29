import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as cartService from '@/services/cartService';
import { productImageUrl } from '@/lib/media';
import {
  clearGuestCart,
  guestCartView,
  guestStockMessage,
  readGuestCart,
  writeGuestCart,
} from '@/lib/guestCart';

/*
 * Carrinho. Feature nova -> Redux Toolkit. Com login, o carrinho e o do
 * backend (regra de estoque, totais e dedupe ficam la). Sem login, fica no
 * navegador (lib/guestCart) e, ao entrar na conta, mergeGuestCart manda os
 * itens para o backend. `variantId` e a unidade vendavel.
 *
 * owner:  'guest' (localStorage) | 'user' (backend) — quem os thunks usam
 *         sai do auth na hora da acao; o checkout so segue com 'user'.
 * status: 'idle' | 'loading' | 'ready' | 'error'
 * opError: mensagem (pt-BR, vinda do backend) da ultima operacao que falhou
 *          por estoque/validacao — exibida no drawer/pagina.
 */
const initialState = {
  cartId: null,
  items: [],
  totalPrice: 0,
  owner: 'guest',
  status: 'idle',
  drawerOpen: false,
  opError: null,
};

const normalizeItem = (item) => ({ ...item, image: productImageUrl(item.image) });

const EMPTY_CART = { cartId: null, items: [], totalPrice: 0 };

function applyCart(state, dto, owner = 'user') {
  state.cartId = dto?.cartId ?? null;
  state.totalPrice = dto?.totalPrice ?? 0;
  state.items = (dto?.items ?? []).map(normalizeItem);
  state.owner = owner;
  state.status = 'ready';
  state.opError = null;
}

const isUser = (getState) => getState().auth?.status === 'authenticated';

// Thunks que funcionam para os dois donos devolvem { owner, cart }.
const asUser = (cart) => ({ owner: 'user', cart });
const asGuest = (items) => ({ owner: 'guest', cart: guestCartView(items) });

/** Usuario logado que ainda nao tem carrinho: 404/500 (e, por um NPE, 401) = vazio. */
async function loadServerCart() {
  try {
    return await cartService.getCart();
  } catch (err) {
    const status = err?.response?.status;
    if (status === 401 || status === 404 || status === 500) return EMPTY_CART;
    throw err;
  }
}

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    return await loadServerCart();
  } catch {
    return rejectWithValue('error');
  }
});

/**
 * Ao entrar na conta: manda o carrinho do visitante para o backend e carrega
 * o carrinho do usuario. Variacao que ja estava no carrinho do servidor nao
 * duplica: fica a maior das duas quantidades. O que o backend recusar
 * (esgotou, saiu do catalogo) fica de fora com um aviso.
 */
export const mergeGuestCart = createAsyncThunk(
  'cart/mergeGuest',
  async (_, { rejectWithValue }) => {
    const guestItems = readGuestCart();
    try {
      let cart = await loadServerCart();
      let skipped = 0;
      for (const item of guestItems) {
        const current = (cart.items || []).find((line) => line.variantId === item.variantId);
        try {
          if (!current) {
            cart = await cartService.addVariantToCart(
              item.productId,
              item.variantId,
              item.quantity,
            );
          } else {
            for (let n = current.quantity; n < item.quantity; n += 1) {
              cart = await cartService.incrementVariant(item.variantId);
            }
          }
        } catch {
          skipped += 1;
        }
      }
      clearGuestCart();
      if (skipped) cart = await loadServerCart();
      return { cart, skipped };
    } catch {
      // Falha de rede antes de juntar: o carrinho do visitante continua guardado.
      return rejectWithValue('error');
    }
  },
);

export const addToCart = createAsyncThunk(
  'cart/add',
  async ({ productId, variantId, quantity = 1, item }, { getState, rejectWithValue }) => {
    const addAsGuest = () => {
      const items = readGuestCart();
      if (items.some((line) => line.variantId === variantId)) {
        return rejectWithValue({ code: 'already_in_cart' });
      }
      const line = { ...item, productId, variantId, quantity };
      if (line.stock != null && quantity > line.stock) {
        return rejectWithValue({ code: 'stock', message: guestStockMessage(line) });
      }
      const next = [...items, line];
      writeGuestCart(next);
      return asGuest(next);
    };

    if (!isUser(getState)) return addAsGuest();
    try {
      return asUser(await cartService.addVariantToCart(productId, variantId, quantity));
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || '';
      // Sessao caiu no meio: a peca entra no carrinho do visitante.
      if (status === 401 || status === 403) return addAsGuest();
      if (status === 400 && /já está no carrinho/i.test(message)) {
        return rejectWithValue({ code: 'already_in_cart' });
      }
      return rejectWithValue({
        code: 'stock',
        message: message || 'Não foi possível adicionar ao carrinho.',
      });
    }
  },
);

/** +1/-1 no carrinho do visitante (no -1 do ultimo, a linha sai, como no backend). */
function changeGuestQuantity(variantId, delta, rejectWithValue) {
  const items = readGuestCart();
  const line = items.find((it) => it.variantId === variantId);
  if (!line) return asGuest(items);
  const quantity = line.quantity + delta;
  if (delta > 0 && line.stock != null && quantity > line.stock) {
    return rejectWithValue(guestStockMessage(line));
  }
  const next =
    quantity <= 0
      ? items.filter((it) => it.variantId !== variantId)
      : items.map((it) => (it.variantId === variantId ? { ...it, quantity } : it));
  writeGuestCart(next);
  return asGuest(next);
}

export const incrementItem = createAsyncThunk(
  'cart/increment',
  async (variantId, { getState, rejectWithValue }) => {
    if (!isUser(getState)) return changeGuestQuantity(variantId, 1, rejectWithValue);
    try {
      return asUser(await cartService.incrementVariant(variantId));
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || 'Não foi possível alterar a quantidade.',
      );
    }
  },
);

export const decrementItem = createAsyncThunk(
  'cart/decrement',
  async (variantId, { getState, rejectWithValue }) => {
    if (!isUser(getState)) return changeGuestQuantity(variantId, -1, rejectWithValue);
    try {
      return asUser(await cartService.decrementVariant(variantId));
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || 'Não foi possível alterar a quantidade.',
      );
    }
  },
);

export const removeItem = createAsyncThunk(
  'cart/remove',
  async ({ cartId, variantId }, { getState, rejectWithValue }) => {
    if (!isUser(getState)) {
      const next = readGuestCart().filter((it) => it.variantId !== variantId);
      writeGuestCart(next);
      return asGuest(next);
    }
    try {
      await cartService.removeVariant(cartId, variantId);
      return asUser(await cartService.getCart()); // DELETE devolve string -> recarrega
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Não foi possível remover o item.');
    }
  },
);

const applyOwned = (state, action) => applyCart(state, action.payload.cart, action.payload.owner);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    openDrawer(state) {
      state.drawerOpen = true;
    },
    closeDrawer(state) {
      state.drawerOpen = false;
      state.opError = null;
    },
    clearOpError(state) {
      state.opError = null;
    },
    clearCart() {
      return { ...initialState, status: 'ready' };
    },
    /** Sem login: mostra o carrinho guardado neste navegador. */
    loadGuestCart(state) {
      applyCart(state, guestCartView(readGuestCart()), 'guest');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCart.fulfilled, (state, action) => applyCart(state, action.payload))
      .addCase(fetchCart.rejected, (state) => {
        state.cartId = null;
        state.items = [];
        state.totalPrice = 0;
        state.status = 'error';
      })
      .addCase(mergeGuestCart.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(mergeGuestCart.fulfilled, (state, action) => {
        applyCart(state, action.payload.cart);
        if (action.payload.skipped) {
          state.opError = 'Alguns itens que você escolheu esgotaram e não entraram no carrinho.';
        }
      })
      .addCase(mergeGuestCart.rejected, (state) => {
        state.cartId = null;
        state.items = [];
        state.totalPrice = 0;
        state.owner = 'user';
        state.status = 'error';
      })
      .addCase(addToCart.fulfilled, applyOwned)
      .addCase(addToCart.rejected, (state, action) => {
        if (action.payload?.code === 'stock') state.opError = action.payload.message;
      })
      .addCase(incrementItem.fulfilled, applyOwned)
      .addCase(decrementItem.fulfilled, applyOwned)
      .addCase(removeItem.fulfilled, applyOwned)
      .addMatcher(
        (action) =>
          [
            incrementItem.rejected.type,
            decrementItem.rejected.type,
            removeItem.rejected.type,
          ].includes(action.type),
        (state, action) => {
          state.opError = typeof action.payload === 'string' ? action.payload : 'Ocorreu um erro.';
        },
      );
  },
});

export const { openDrawer, closeDrawer, clearOpError, clearCart, loadGuestCart } =
  cartSlice.actions;
export default cartSlice.reducer;

export const selectCart = (state) => state.cart;
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.totalPrice;
export const selectCartDrawerOpen = (state) => state.cart.drawerOpen;
/** Carrinho do usuario logado ja carregado (o checkout espera isso antes de decidir). */
export const selectServerCartReady = (state) =>
  state.cart.owner === 'user' && state.cart.status === 'ready';
export const selectCartCount = (state) =>
  state.cart.items.reduce((total, item) => total + (item.quantity || 0), 0);
