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

import { createAddress, getUserAddresses } from '@/services/addressService';
import Conta from './Conta';

const render = () =>
  renderWithProviders(<Conta />, { preloadedState: authenticatedAuth, route: '/conta' });

beforeEach(() => vi.clearAllMocks());

describe('Conta', () => {
  it('mostra o perfil e o estado vazio de enderecos', async () => {
    getUserAddresses.mockResolvedValue([]);
    render();
    expect(screen.getByRole('heading', { name: 'Minha conta' })).toBeInTheDocument();
    expect(screen.getByText('maria')).toBeInTheDocument();
    expect(await screen.findByText('Nenhum endereço cadastrado')).toBeInTheDocument();
  });

  it('lista os enderecos do usuario', async () => {
    getUserAddresses.mockResolvedValue([
      {
        addressId: 1,
        street: 'Rua das Flores',
        buildingName: 'Apto 1',
        city: 'Recife',
        state: 'PE',
        country: 'Brasil',
        pincode: '50000000',
      },
    ]);
    render();
    expect(await screen.findByText('Rua das Flores')).toBeInTheDocument();
    expect(screen.getByText(/Recife — PE, Brasil/)).toBeInTheDocument();
  });

  it('adiciona um endereco pelo formulario', async () => {
    getUserAddresses.mockResolvedValue([]);
    createAddress.mockResolvedValue({
      addressId: 5,
      street: 'Rua Nova das Casas',
      buildingName: 'Bloco B12',
      city: 'Olinda',
      state: 'PE',
      country: 'Brasil',
      pincode: '53000000',
    });
    render();
    await screen.findByText('Nenhum endereço cadastrado');

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar endereço' }));
    fireEvent.change(screen.getByLabelText('Rua'), { target: { value: 'Rua Nova das Casas' } });
    fireEvent.change(screen.getByLabelText('Complemento / Número'), {
      target: { value: 'Bloco B12' },
    });
    fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'Olinda' } });
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'PE' } });
    fireEvent.change(screen.getByLabelText('País'), { target: { value: 'Brasil' } });
    fireEvent.change(screen.getByLabelText('CEP'), { target: { value: '53000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar endereço' }));

    await waitFor(() => expect(createAddress).toHaveBeenCalled());
    expect(await screen.findByText('Rua Nova das Casas')).toBeInTheDocument();
  });
});
