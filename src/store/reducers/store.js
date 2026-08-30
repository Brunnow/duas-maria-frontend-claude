import { configureStore } from '@reduxjs/toolkit';

import authReducer from '@/features/auth/authSlice';
import cartReducer from '@/features/cart/cartSlice';
import addressReducer from '@/features/address/addressSlice';
import { ProductReducer } from './ProductReducer';
import { errorReducer } from './errorReducer';

export const store = configureStore({
  reducer: {
    products: ProductReducer,
    errors: errorReducer,
    auth: authReducer,
    cart: cartReducer,
    address: addressReducer,
  },
  preloadedState: {},
});

export default store;
