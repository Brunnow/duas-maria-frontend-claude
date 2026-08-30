import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as addressService from '@/services/addressService';

/*
 * Enderecos do usuario. Feature nova -> Redux Toolkit.
 * status: 'idle' | 'loading' | 'ready' | 'error'
 */
const initialState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchAddresses = createAsyncThunk('address/fetch', async (_, { rejectWithValue }) => {
  try {
    return await addressService.getUserAddresses();
  } catch {
    return rejectWithValue('Não foi possível carregar seus endereços.');
  }
});

export const saveAddress = createAsyncThunk(
  'address/save',
  async ({ addressId, data }, { rejectWithValue }) => {
    try {
      return addressId
        ? await addressService.updateAddress(addressId, data)
        : await addressService.createAddress(data);
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Não foi possível salvar o endereço.');
    }
  },
);

export const removeAddress = createAsyncThunk(
  'address/remove',
  async (addressId, { rejectWithValue }) => {
    try {
      await addressService.deleteAddress(addressId);
      return addressId;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || 'Não foi possível remover o endereço.',
      );
    }
  },
);

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    clearAddresses: () => ({ ...initialState }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.items = Array.isArray(action.payload) ? action.payload : [];
        state.status = 'ready';
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload;
      })
      .addCase(saveAddress.fulfilled, (state, action) => {
        const saved = action.payload;
        const index = state.items.findIndex((a) => a.addressId === saved.addressId);
        if (index >= 0) state.items[index] = saved;
        else state.items.push(saved);
      })
      .addCase(removeAddress.fulfilled, (state, action) => {
        state.items = state.items.filter((a) => a.addressId !== action.payload);
      });
  },
});

export const { clearAddresses } = addressSlice.actions;
export default addressSlice.reducer;

export const selectAddresses = (state) => state.address.items;
export const selectAddressStatus = (state) => state.address.status;
export const selectAddressError = (state) => state.address.error;
