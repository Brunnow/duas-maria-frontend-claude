import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as cartService from '@/services/cartService';
import { productImageUrl } from '@/lib/media';

/*
 * Carrinho. Feature nova -> Redux Toolkit. O carrinho SO existe no backend
 * (exige autenticacao); o frontend nao guarda carrinho local nem duplica
 * regra de estoque. `variantId` e a unidade vendavel.
 *
 * status: 'idle' | 'loading' | 'ready' | 'error'
 * opError: mensagem (pt-BR, vinda do backend) da ultima operacao que falhou
 *          por estoque/validacao — exibida no drawer/pagina.
 */
const initialState = {
  cartId: null,
  items: [],
  totalPrice: 0,
  status: 'idle',
  drawerOpen: false,
  opError: null,
};

const normalizeItem = (item) => ({ ...item, image: productImageUrl(item.image) });

function applyCart(state, dto) {
  state.cartId = dto?.cartId ?? null;
  state.totalPrice = dto?.totalPrice ?? 0;
  state.items = (dto?.items ?? []).map(normalizeItem);
  state.status = 'ready';
  state.opError = null;
}

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    return await cartService.getCart();
  } catch (err) {
    const status = err?.response?.status;
    // Usuario logado que ainda nao tem carrinho: o backend responde 404/500.
    if (status === 404 || status === 500) return { cartId: null, items: [], totalPrice: 0 };
    return rejectWithValue(status === 401 ? 'unauthorized' : 'error');
  }
});

export const addToCart = createAsyncThunk(
  'cart/add',
  async ({ productId, variantId, quantity = 1 }, { rejectWithValue }) => {
    try {
      return await cartService.addVariantToCart(productId, variantId, quantity);
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || '';
      if (status === 401 || status === 403) return rejectWithValue({ code: 'unauthorized' });
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

export const incrementItem = createAsyncThunk(
  'cart/increment',
  async (variantId, { rejectWithValue }) => {
    try {
      return await cartService.incrementVariant(variantId);
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || 'Não foi possível alterar a quantidade.',
      );
    }
  },
);

export const decrementItem = createAsyncThunk(
  'cart/decrement',
  async (variantId, { rejectWithValue }) => {
    try {
      return await cartService.decrementVariant(variantId);
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || 'Não foi possível alterar a quantidade.',
      );
    }
  },
);

export const removeItem = createAsyncThunk(
  'cart/remove',
  async ({ cartId, variantId }, { rejectWithValue }) => {
    try {
      await cartService.removeVariant(cartId, variantId);
      return await cartService.getCart(); // DELETE devolve string -> recarrega
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Não foi possível remover o item.');
    }
  },
);

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
      .addCase(addToCart.fulfilled, (state, action) => applyCart(state, action.payload))
      .addCase(addToCart.rejected, (state, action) => {
        if (action.payload?.code === 'stock') state.opError = action.payload.message;
      })
      .addCase(incrementItem.fulfilled, (state, action) => applyCart(state, action.payload))
      .addCase(decrementItem.fulfilled, (state, action) => applyCart(state, action.payload))
      .addCase(removeItem.fulfilled, (state, action) => applyCart(state, action.payload))
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

export const { openDrawer, closeDrawer, clearOpError, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

export const selectCart = (state) => state.cart;
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.totalPrice;
export const selectCartDrawerOpen = (state) => state.cart.drawerOpen;
export const selectCartCount = (state) =>
  state.cart.items.reduce((total, item) => total + (item.quantity || 0), 0);
