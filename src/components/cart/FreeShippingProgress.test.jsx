import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('@/services/storeSettingsService', () => ({ getPublicStoreSettings: vi.fn() }));

import { getPublicStoreSettings } from '@/services/storeSettingsService';
import FreeShippingProgress from './FreeShippingProgress';

beforeEach(() => vi.clearAllMocks());

describe('FreeShippingProgress', () => {
  it('mostra quanto falta para o frete gratis', async () => {
    getPublicStoreSettings.mockResolvedValue({ freeShippingMinAmount: 300 });
    render(<FreeShippingProgress subtotal={250} />);

    expect(await screen.findByText(/R\$\s*50,00/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '83');
  });

  it('avisa quando o frete gratis foi atingido', async () => {
    getPublicStoreSettings.mockResolvedValue({ freeShippingMinAmount: 300 });
    render(<FreeShippingProgress subtotal={300} />);

    expect(await screen.findByText(/Você ganhou/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('nao renderiza nada quando o frete gratis esta desativado', async () => {
    getPublicStoreSettings.mockResolvedValue({ freeShippingMinAmount: null });
    const { container } = render(<FreeShippingProgress subtotal={250} />);

    await waitFor(() => expect(getPublicStoreSettings).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('nao renderiza nada se a configuracao falhar', async () => {
    getPublicStoreSettings.mockRejectedValue(new Error('offline'));
    const { container } = render(<FreeShippingProgress subtotal={250} />);

    await waitFor(() => expect(getPublicStoreSettings).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
