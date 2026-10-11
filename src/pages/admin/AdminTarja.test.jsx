import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { adminAuth, renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/services/storeSettingsService', () => ({
  getStoreSettings: vi.fn(),
  saveAnnouncementBar: vi.fn(),
}));

import * as svc from '@/services/storeSettingsService';
import AdminTarja from './AdminTarja';

beforeEach(() => vi.clearAllMocks());

describe('AdminTarja', () => {
  it('preenche com a tarja salva e mostra a previa', async () => {
    svc.getStoreSettings.mockResolvedValue({
      announcementEnabled: true,
      announcementText: 'Ganhe 10%',
      announcementCouponCode: 'PRIMEIRACOMPRA',
    });
    renderWithProviders(<AdminTarja />, { preloadedState: adminAuth });

    expect(await screen.findByLabelText('Texto da tarja')).toHaveValue('Ganhe 10%');
    expect(screen.getByLabelText('Mostrar a tarja no site')).toBeChecked();
    expect(screen.getByText('Prévia')).toBeInTheDocument();
  });

  it('salva texto e cupom', async () => {
    svc.getStoreSettings.mockResolvedValue({ announcementEnabled: false });
    svc.saveAnnouncementBar.mockResolvedValue({
      announcementEnabled: true,
      announcementText: 'Ganhe 10%',
      announcementCouponCode: 'PRIMEIRACOMPRA',
    });
    renderWithProviders(<AdminTarja />, { preloadedState: adminAuth });

    fireEvent.click(await screen.findByLabelText('Mostrar a tarja no site'));
    fireEvent.change(screen.getByLabelText('Texto da tarja'), { target: { value: 'Ganhe 10%' } });
    fireEvent.change(screen.getByLabelText('Cupom (opcional)'), {
      target: { value: 'primeiracompra' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(svc.saveAnnouncementBar).toHaveBeenCalledWith({
        enabled: true,
        text: 'Ganhe 10%',
        couponCode: 'primeiracompra',
      }),
    );
    expect(await screen.findByText('Tarja salva e visível no site.')).toBeInTheDocument();
  });

  it('bloqueia ligar a tarja sem texto', async () => {
    svc.getStoreSettings.mockResolvedValue({ announcementEnabled: false });
    renderWithProviders(<AdminTarja />, { preloadedState: adminAuth });

    fireEvent.click(await screen.findByLabelText('Mostrar a tarja no site'));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Informe o texto da tarja para exibi-la.')).toBeInTheDocument();
    expect(svc.saveAnnouncementBar).not.toHaveBeenCalled();
  });

  it('mostra o erro do backend quando o cupom nao existe', async () => {
    svc.getStoreSettings.mockResolvedValue({ announcementEnabled: false });
    svc.saveAnnouncementBar.mockRejectedValue({
      response: { data: { message: 'Cupom XYZ não encontrado. Cadastre o cupom antes de divulgá-lo.' } },
    });
    renderWithProviders(<AdminTarja />, { preloadedState: adminAuth });

    fireEvent.change(await screen.findByLabelText('Texto da tarja'), { target: { value: 'Oi' } });
    fireEvent.change(screen.getByLabelText('Cupom (opcional)'), { target: { value: 'xyz' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Cupom XYZ não encontrado');
  });
});
