import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '@/features/auth/authSlice';
import cartReducer from '@/features/cart/cartSlice';
import addressReducer from '@/features/address/addressSlice';
import { ProductReducer } from '@/store/reducers/ProductReducer';
import { errorReducer } from '@/store/reducers/errorReducer';

/** Store minima para testes (auth + cart + address + products/errors legados). */
export function makeStore(preloadedState) {
  return configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
      address: addressReducer,
      products: ProductReducer,
      errors: errorReducer,
    },
    preloadedState,
  });
}

/** Estados de auth prontos para os testes. */
export const anonymousAuth = { auth: { user: null, roles: [], status: 'anonymous' } };
export const authenticatedAuth = {
  auth: {
    user: { id: 1, username: 'maria', roles: ['ROLE_USER'] },
    roles: ['ROLE_USER'],
    status: 'authenticated',
  },
};
export const adminAuth = {
  auth: {
    user: { id: 3, username: 'admin', roles: ['ROLE_ADMIN', 'ROLE_USER'] },
    roles: ['ROLE_ADMIN', 'ROLE_USER'],
    status: 'authenticated',
  },
};

/** Estado de carrinho com N itens para os testes. */
export function cartState(items = [], overrides = {}) {
  return {
    cart: {
      cartId: 1,
      items,
      totalPrice: items.reduce((sum, it) => sum + (it.lineTotal || 0), 0),
      status: 'ready',
      drawerOpen: false,
      opError: null,
      ...overrides,
    },
  };
}

/**
 * Renderiza `ui` dentro de <Provider> + <MemoryRouter>.
 * options: { route, preloadedState, store }
 */
export function renderWithProviders(
  ui,
  { route = '/', preloadedState = anonymousAuth, store = makeStore(preloadedState) } = {},
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper }) };
}
