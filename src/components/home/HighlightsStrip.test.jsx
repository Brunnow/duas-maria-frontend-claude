import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/services/storeSettingsService', () => ({ getPublicStoreSettings: vi.fn() }));

import { getPublicStoreSettings } from '@/services/storeSettingsService';
import HighlightsStrip from './HighlightsStrip';

const settings = (overrides = {}) => ({
  freeShippingMinAmount: 500,
  highlightsEnabled: true,
  highlights: [
    { kind: 'TEXT', icon: 'CARD', text: 'Parcele em até 6x sem juros' },
    { kind: 'TEXT', icon: 'TRUCK', text: 'Entregamos para todo o Brasil' },
    { kind: 'FREE_SHIPPING', icon: 'GIFT', text: null },
  ],
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.useRealTimers());

describe('HighlightsStrip', () => {
  it('mostra todos os itens e monta o texto do frete gratis a partir do minimo', async () => {
    getPublicStoreSettings.mockResolvedValue(settings());
    render(<HighlightsStrip />);

    expect(await screen.findByText('Parcele em até 6x sem juros')).toBeInTheDocument();
    expect(screen.getByText('Entregamos para todo o Brasil')).toBeInTheDocument();
    expect(screen.getByText(/Frete grátis acima de R\$\s*500,00/)).toBeInTheDocument();
  });

  it('no celular/tablet, so o item atual fica visivel; os outros ficam para leitor de tela', async () => {
    getPublicStoreSettings.mockResolvedValue(settings());
    render(<HighlightsStrip />);

    const first = (await screen.findByText('Parcele em até 6x sem juros')).closest('li');
    const second = screen.getByText('Entregamos para todo o Brasil').closest('li');
    expect(first.className).not.toContain('max-lg:sr-only');
    expect(second.className).toContain('max-lg:sr-only');
  });

  it('troca de item sozinho a cada 4 segundos', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getPublicStoreSettings.mockResolvedValue(settings());
    render(<HighlightsStrip />);
    await screen.findByText('Parcele em até 6x sem juros');

    act(() => vi.advanceTimersByTime(4000));

    const second = screen.getByText('Entregamos para todo o Brasil').closest('li');
    expect(second.className).not.toContain('max-lg:sr-only');
  });

  it('sem frete gratis configurado, o item de frete gratis some', async () => {
    getPublicStoreSettings.mockResolvedValue(settings({ freeShippingMinAmount: null }));
    render(<HighlightsStrip />);

    await screen.findByText('Parcele em até 6x sem juros');
    expect(screen.queryByText(/Frete grátis/)).not.toBeInTheDocument();
  });

  it('sem itens nao renderiza nada', async () => {
    getPublicStoreSettings.mockResolvedValue(settings({ highlights: [] }));
    const { container } = render(<HighlightsStrip />);

    await waitFor(() => expect(getPublicStoreSettings).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
