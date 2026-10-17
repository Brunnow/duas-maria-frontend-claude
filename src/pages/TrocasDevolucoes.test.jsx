import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TrocasDevolucoes from './TrocasDevolucoes';

describe('TrocasDevolucoes', () => {
  it('mostra as regras da loja e o contato para solicitar', () => {
    render(
      <MemoryRouter>
        <TrocasDevolucoes />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Trocas e devoluções' })).toBeInTheDocument();
    expect(screen.getByText('7 dias para trocar ou devolver')).toBeInTheDocument();
    expect(screen.getByText('Peça com a etiqueta presa.')).toBeInTheDocument();
    expect(screen.getByText(/Peças compradas em promoção não têm troca/)).toBeInTheDocument();
    expect(screen.getByText(/primeira troca ou devolução de cada pedido é por nossa conta/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Solicitar pelo WhatsApp' })).toHaveAttribute(
      'href',
      'https://wa.me/5561995730440',
    );
  });
});
