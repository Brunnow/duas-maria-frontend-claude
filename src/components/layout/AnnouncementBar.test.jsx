import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/services/storeSettingsService', () => ({ getPublicStoreSettings: vi.fn() }));

import { getPublicStoreSettings } from '@/services/storeSettingsService';
import AnnouncementBar from './AnnouncementBar';

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

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

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('erro ao carregar nao renderiza nada', async () => {
    getPublicStoreSettings.mockRejectedValue(new Error('offline'));
    const { container } = render(<AnnouncementBar />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('primeira visita: reserva o espaco da tarja enquanto carrega', () => {
    getPublicStoreSettings.mockReturnValue(new Promise(() => {}));
    const { container } = render(<AnnouncementBar />);

    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('visita seguinte: mostra na hora a ultima tarja vista e guarda a nova', async () => {
    window.localStorage.setItem(
      'dm-announcement',
      JSON.stringify({ text: 'Tarja de ontem', code: 'ONTEM' }),
    );
    let resolve;
    getPublicStoreSettings.mockReturnValue(new Promise((r) => (resolve = r)));
    render(<AnnouncementBar />);

    expect(screen.getByText('Tarja de ontem')).toBeInTheDocument();

    resolve({ announcementEnabled: true, announcementText: 'Tarja de hoje', announcementCouponCode: null });
    expect(await screen.findByText('Tarja de hoje')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('dm-announcement'))).toEqual({
      text: 'Tarja de hoje',
      code: null,
    });
  });

  it('visita seguinte com a tarja desligada: nao reserva espaco', () => {
    window.localStorage.setItem('dm-announcement', JSON.stringify({ off: true }));
    getPublicStoreSettings.mockReturnValue(new Promise(() => {}));
    const { container } = render(<AnnouncementBar />);

    expect(container).toBeEmptyDOMElement();
  });
});
