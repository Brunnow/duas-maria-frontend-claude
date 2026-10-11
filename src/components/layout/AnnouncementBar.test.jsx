import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/services/storeSettingsService', () => ({ getPublicStoreSettings: vi.fn() }));

import { getPublicStoreSettings } from '@/services/storeSettingsService';
import AnnouncementBar from './AnnouncementBar';

beforeEach(() => vi.clearAllMocks());

describe('AnnouncementBar', () => {
  it('mostra o texto e o cupom, e copia o codigo ao clicar', async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.assign(navigator, { clipboard: { writeText } });
    getPublicStoreSettings.mockResolvedValue({
      announcementEnabled: true,
      announcementText: 'Ganhe 10% na primeira compra com o cupom',
      announcementCouponCode: 'PRIMEIRACOMPRA',
    });
    render(<AnnouncementBar />);

    expect(await screen.findByText('Ganhe 10% na primeira compra com o cupom')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Copiar cupom PRIMEIRACOMPRA' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('PRIMEIRACOMPRA'));
    expect(await screen.findByText('Cupom copiado!')).toBeInTheDocument();
  });

  it('sem cupom mostra so o texto', async () => {
    getPublicStoreSettings.mockResolvedValue({
      announcementEnabled: true,
      announcementText: 'Frete grátis acima de R$ 500',
      announcementCouponCode: null,
    });
    render(<AnnouncementBar />);

    expect(await screen.findByText('Frete grátis acima de R$ 500')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('desligada nao renderiza nada', async () => {
    getPublicStoreSettings.mockResolvedValue({ announcementEnabled: false });
    const { container } = render(<AnnouncementBar />);

    await waitFor(() => expect(getPublicStoreSettings).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('erro ao carregar nao renderiza nada', async () => {
    getPublicStoreSettings.mockRejectedValue(new Error('offline'));
    const { container } = render(<AnnouncementBar />);

    await waitFor(() => expect(getPublicStoreSettings).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
