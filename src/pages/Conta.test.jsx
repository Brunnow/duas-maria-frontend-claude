import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { authenticatedAuth, renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/services/addressService', () => ({
  getUserAddresses: vi.fn(),
  createAddress: vi.fn(),
  updateAddress: vi.fn(),
  deleteAddress: vi.fn(),
}));
vi.mock('@/services/authService', () => ({
  signin: vi.fn(),
  signup: vi.fn(),
  currentUser: vi.fn(),
  signout: vi.fn(),
}));
vi.mock('@/services/viaCep', async () => {
  const actual = await vi.importActual('@/services/viaCep');
  return { ...actual, lookupCep: vi.fn().mockResolvedValue({}) };
});

import { createAddress, getUserAddresses } from '@/services/addressService';
import Conta from './Conta';

const render = () =>
  renderWithProviders(<Conta />, { preloadedState: authenticatedAuth, route: '/conta' });

const A1 = {
  addressId: 1,
  recipientName: 'Maria da Silva',
  phone: '(81) 91234-5678',
  pincode: '50000-000',
  street: 'Rua das Flores',
  number: '10',
  buildingName: 'Apto 1',
  neighborhood: 'Boa Viagem',
  city: 'Recife',
  state: 'PE',
};

beforeEach(() => vi.clearAllMocks());

describe('Conta', () => {
  it('mostra o perfil e o estado vazio de enderecos', async () => {
    getUserAddresses.mockResolvedValue([]);
    render();
    expect(screen.getByRole('heading', { name: 'Minha conta' })).toBeInTheDocument();
    expect(screen.getByText('maria')).toBeInTheDocument();
    expect(await screen.findByText('Nenhum endereço cadastrado')).toBeInTheDocument();
  });

  it('lista os enderecos do usuario no formato brasileiro', async () => {
    getUserAddresses.mockResolvedValue([A1]);
    render();
    expect(await screen.findByText(/Rua das Flores, 10 - Apto 1/)).toBeInTheDocument();
    expect(screen.getByText(/Boa Viagem - Recife\/PE/)).toBeInTheDocument();
    expect(screen.getByText('CEP 50000-000')).toBeInTheDocument();
  });

  it('adiciona um endereco pelo formulario', async () => {
    getUserAddresses.mockResolvedValue([]);
    createAddress.mockResolvedValue({ ...A1, addressId: 5, street: 'Rua Nova das Casas' });
    render();
    await screen.findByText('Nenhum endereço cadastrado');

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar endereço' }));
    fireEvent.change(screen.getByLabelText('Nome de quem vai receber'), {
      target: { value: 'Maria da Silva' },
    });
    fireEvent.change(screen.getByLabelText('Telefone'), { target: { value: '(81) 91234-5678' } });
    fireEvent.change(screen.getByLabelText('CEP'), { target: { value: '53000-000' } });
    fireEvent.change(screen.getByLabelText('Logradouro'), {
      target: { value: 'Rua Nova das Casas' },
    });
    fireEvent.change(screen.getByLabelText('Número'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Bairro'), { target: { value: 'Casa Caiada' } });
    fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'Olinda' } });
    fireEvent.change(screen.getByLabelText('UF'), { target: { value: 'PE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar endereço' }));

    await waitFor(() => expect(createAddress).toHaveBeenCalled());
    expect(await screen.findByText(/Rua Nova das Casas/)).toBeInTheDocument();
  });
});
