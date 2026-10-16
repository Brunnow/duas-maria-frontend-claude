import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { anonymousAuth, makeStore } from '@/test/renderWithProviders';

vi.mock('@/services/authService', () => ({
  signin: vi.fn(),
  signup: vi.fn(),
  currentUser: vi.fn(),
  signout: vi.fn(),
}));

import { currentUser, signin, signup } from '@/services/authService';
import Login from './Login';
import Cadastro from './Cadastro';

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

const renderLogin = () =>
  render(
    <Provider store={makeStore(anonymousAuth)}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

const fill = () => {
  fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: 'maria' } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'segredo1' } });
};

beforeEach(() => vi.clearAllMocks());

describe('Login', () => {
  it('valida os campos obrigatorios antes de enviar', async () => {
    renderLogin();
    screen.getByRole('button', { name: 'Entrar' }).click();
    expect(await screen.findByText('Informe seu usuário')).toBeInTheDocument();
    expect(screen.getByText('Informe sua senha')).toBeInTheDocument();
    expect(signin).not.toHaveBeenCalled();
  });

  it('mostra mensagem de credenciais invalidas no 404', async () => {
    signin.mockRejectedValue({ response: { status: 404 } });
    renderLogin();
    fill();
    screen.getByRole('button', { name: 'Entrar' }).click();
    expect(await screen.findByRole('alert')).toHaveTextContent('Usuário ou senha inválidos.');
  });

  it('entra e redireciona no sucesso', async () => {
    signin.mockResolvedValue({});
    currentUser.mockResolvedValue({ id: 1, username: 'maria', roles: ['ROLE_USER'] });
    renderLogin();
    fill();
    screen.getByRole('button', { name: 'Entrar' }).click();
    expect(await screen.findByText('Home')).toBeInTheDocument();
  });
  it('quem cria a conta no meio da compra volta para o produto depois de entrar', async () => {
    signup.mockResolvedValue({});
    signin.mockResolvedValue({});
    currentUser.mockResolvedValue({ id: 1, username: 'maria', roles: ['ROLE_USER'] });
    const from = { pathname: '/produtos/7', search: '?cor=azul' };
    render(
      <Provider store={makeStore(anonymousAuth)}>
        <MemoryRouter
          initialEntries={[{ pathname: '/login', state: { from, message: 'Entre para adicionar' } }]}
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/produtos/:id" element={<LocationProbe />} />
            <Route path="/" element={<div>Home</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Criar conta' }));
    fireEvent.change(await screen.findByLabelText('Usuário'), { target: { value: 'maria' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'maria@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'segredo1' } });
    fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'segredo1' } });
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText('Cadastro concluído. Faça login para continuar.')).toBeInTheDocument();
    fill();
    screen.getByRole('button', { name: 'Entrar' }).click();

    expect(await screen.findByTestId('location')).toHaveTextContent('/produtos/7?cor=azul');
  });
});
