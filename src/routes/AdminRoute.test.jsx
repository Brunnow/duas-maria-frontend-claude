import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { adminAuth, anonymousAuth, authenticatedAuth, makeStore } from '@/test/renderWithProviders';
import AdminRoute from './AdminRoute';

const renderGuarded = (preloadedState) =>
  render(
    <Provider store={makeStore(preloadedState)}>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminRoute />}>
            <Route index element={<div>Painel admin</div>} />
          </Route>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/login" element={<div>Tela de login</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

describe('AdminRoute', () => {
  it('anonimo -> /login', () => {
    renderGuarded(anonymousAuth);
    expect(screen.getByText('Tela de login')).toBeInTheDocument();
  });

  it('autenticado sem ROLE_ADMIN -> home', () => {
    renderGuarded(authenticatedAuth);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Painel admin')).not.toBeInTheDocument();
  });

  it('ROLE_ADMIN -> renderiza a rota', () => {
    renderGuarded(adminAuth);
    expect(screen.getByText('Painel admin')).toBeInTheDocument();
  });
});
