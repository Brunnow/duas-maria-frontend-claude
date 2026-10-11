import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/services/storeSettingsService', () => ({ saveHighlights: vi.fn() }));

import { saveHighlights } from '@/services/storeSettingsService';
import HighlightsForm from './HighlightsForm';

const initial = {
  freeShippingMinAmount: 500,
  highlightsEnabled: false,
  highlights: [
    { kind: 'TEXT', icon: 'CARD', text: 'Parcele em até 6x sem juros' },
    { kind: 'FREE_SHIPPING', icon: 'GIFT', text: null },
  ],
};

beforeEach(() => vi.clearAllMocks());

describe('HighlightsForm', () => {
  it('mostra o texto automatico do item de frete gratis', () => {
    render(<HighlightsForm initial={initial} />);

    expect(screen.getByLabelText('Texto do item 1')).toHaveValue('Parcele em até 6x sem juros');
    expect(screen.getByText(/Frete grátis acima de R\$\s*500,00/)).toBeInTheDocument();
    // ja existe item de frete gratis: o botao de adicionar outro nao aparece
    expect(screen.queryByRole('button', { name: 'Adicionar item de frete grátis' })).not.toBeInTheDocument();
  });

  it('reordena, liga e salva na ordem nova', async () => {
    saveHighlights.mockResolvedValue({});
    const onSaved = vi.fn();
    render(<HighlightsForm initial={initial} onSaved={onSaved} />);

    fireEvent.click(screen.getByRole('button', { name: 'Mover item 2 para cima' }));
    fireEvent.click(screen.getByLabelText('Mostrar a faixa de benefícios no site'));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar faixa' }));

    await waitFor(() =>
      expect(saveHighlights).toHaveBeenCalledWith({
        enabled: true,
        items: [
          { kind: 'FREE_SHIPPING', icon: 'GIFT', text: null },
          { kind: 'TEXT', icon: 'CARD', text: 'Parcele em até 6x sem juros' },
        ],
      }),
    );
    expect(onSaved).toHaveBeenCalled();
    expect(await screen.findByText('Faixa salva e visível no site.')).toBeInTheDocument();
  });

  it('bloqueia item de texto vazio', async () => {
    render(<HighlightsForm initial={initial} />);

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar item' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar faixa' }));

    expect(await screen.findByText('Preencha o texto de todos os itens.')).toBeInTheDocument();
    expect(saveHighlights).not.toHaveBeenCalled();
  });

  it('remove itens e esconde "Adicionar" ao chegar em 4', () => {
    render(<HighlightsForm initial={initial} />);

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar item' }));
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar item' }));
    expect(screen.queryByRole('button', { name: 'Adicionar item' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remover item 4' }));
    expect(screen.getByRole('button', { name: 'Adicionar item' })).toBeInTheDocument();
  });

  it('com frete gratis desativado avisa que o item fica oculto', () => {
    render(<HighlightsForm initial={{ ...initial, freeShippingMinAmount: null }} />);

    expect(screen.getByText(/Frete grátis desativado: este item fica oculto no site/)).toBeInTheDocument();
  });
});
