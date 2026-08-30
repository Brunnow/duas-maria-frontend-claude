import { configureStore } from '@reduxjs/toolkit';

import authReducer from '@/features/auth/authSlice';
import { ProductReducer } from './ProductReducer';
import { errorReducer } from './errorReducer';

export const store = configureStore({
  reducer: {
    products: ProductReducer,
    errors: errorReducer,
    auth: authReducer,
  },
  preloadedState: {},
});

export default store;
