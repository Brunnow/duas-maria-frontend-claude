import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { adminAuth, renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/services/storeSettingsService', () => ({
  getStoreSettings: vi.fn(),
  saveStoreSettings: vi.fn(),
}));

import * as svc from '@/services/storeSettingsService';
import AdminFreteGratis from './AdminFreteGratis';

beforeEach(() => vi.clearAllMocks());

const field = () => screen.findByLabelText('Frete grátis a partir de (R$)');

describe('AdminFreteGratis', () => {
  it('mostra desativado e campo vazio quando nao ha valor configurado', async () => {
    svc.getStoreSettings.mockResolvedValue({ freeShippingMinAmount: null });
    renderWithProviders(<AdminFreteGratis />, { preloadedState: adminAuth });

    expect(await field()).toHaveValue('');
    expect(screen.getByText('Desativado no momento.')).toBeInTheDocument();
  });

  it('preenche o valor ja configurado', async () => {
    svc.getStoreSettings.mockResolvedValue({ freeShippingMinAmount: 299.9 });
    renderWithProviders(<AdminFreteGratis />, { preloadedState: adminAuth });

    expect(await field()).toHaveValue('299.9');
    expect(screen.getByText(/Ativo: frete grátis a partir de/)).toBeInTheDocument();
  });

  it('salva o valor informado', async () => {
    svc.getStoreSettings.mockResolvedValue({ freeShippingMinAmount: null });
    svc.saveStoreSettings.mockResolvedValue({ freeShippingMinAmount: 199.9 });
    renderWithProviders(<AdminFreteGratis />, { preloadedState: adminAuth });

    fireEvent.change(await field(), { target: { value: '199.90' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(svc.saveStoreSettings).toHaveBeenCalledWith({ freeShippingMinAmount: 199.9 }),
    );
    expect(await screen.findByText('Frete grátis atualizado.')).toBeInTheDocument();
  });

  it('aceita valor com vírgula (teclado pt-BR do celular)', async () => {
    svc.getStoreSettings.mockResolvedValue({ freeShippingMinAmount: null });
    svc.saveStoreSettings.mockResolvedValue({ freeShippingMinAmount: 299.9 });
    renderWithProviders(<AdminFreteGratis />, { preloadedState: adminAuth });

    fireEvent.change(await field(), { target: { value: '299,90' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(svc.saveStoreSettings).toHaveBeenCalledWith({ freeShippingMinAmount: 299.9 }),
    );
  });

  it('campo vazio desativa o frete gratis', async () => {
    svc.getStoreSettings.mockResolvedValue({ freeShippingMinAmount: 299.9 });
    svc.saveStoreSettings.mockResolvedValue({ freeShippingMinAmount: null });
    renderWithProviders(<AdminFreteGratis />, { preloadedState: adminAuth });

    fireEvent.change(await field(), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(svc.saveStoreSettings).toHaveBeenCalledWith({ freeShippingMinAmount: null }),
    );
    expect(await screen.findByText('Frete grátis desativado.')).toBeInTheDocument();
  });

  it('bloqueia valor zero sem chamar a API', async () => {
    svc.getStoreSettings.mockResolvedValue({ freeShippingMinAmount: null });
    renderWithProviders(<AdminFreteGratis />, { preloadedState: adminAuth });

    fireEvent.change(await field(), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(
      await screen.findByText('Informe um valor maior que zero, ou deixe vazio para desativar.'),
    ).toBeInTheDocument();
    expect(svc.saveStoreSettings).not.toHaveBeenCalled();
  });
});
