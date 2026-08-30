import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { anonymousAuth, authenticatedAuth, makeStore } from '@/test/renderWithProviders';
import ProtectedRoute from './ProtectedRoute';

const renderGuarded = (preloadedState) =>
  render(
    <Provider store={makeStore(preloadedState)}>
      <MemoryRouter initialEntries={['/conta']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/conta" element={<div>Área privada</div>} />
          </Route>
          <Route path="/login" element={<div>Tela de login</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

describe('ProtectedRoute', () => {
  it('redireciona para /login quando anonimo', () => {
    renderGuarded(anonymousAuth);
    expect(screen.getByText('Tela de login')).toBeInTheDocument();
  });

  it('renderiza a rota quando autenticado', () => {
    renderGuarded(authenticatedAuth);
    expect(screen.getByText('Área privada')).toBeInTheDocument();
  });

  it('mostra carregando enquanto a sessao nao foi verificada', () => {
    renderGuarded({ auth: { user: null, roles: [], status: 'idle' } });
    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument();
    expect(screen.queryByText('Tela de login')).not.toBeInTheDocument();
  });
});
