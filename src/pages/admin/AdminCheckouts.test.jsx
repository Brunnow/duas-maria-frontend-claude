import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/services/adminCheckoutLeadService', () => ({ listCheckoutLeads: vi.fn() }));

import { listCheckoutLeads } from '@/services/adminCheckoutLeadService';
import AdminCheckouts from './AdminCheckouts';

const page = (content) => ({
  content,
  pageNumber: 0,
  pageSize: 20,
  totalElements: content.length,
  totalPages: 1,
  lastPage: true,
});

function renderPage() {
  render(
    <MemoryRouter>
      <AdminCheckouts />
    </MemoryRouter>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe('AdminCheckouts', () => {
  it('lista quem não terminou, com carrinho, valor e botão de WhatsApp', async () => {
    listCheckoutLeads.mockResolvedValue(
      page([
        {
          id: 1,
          name: 'Maria da Silva',
          email: 'maria@exemplo.com',
          phone: '(81) 91234-5678',
          itemsSummary: '2x Vestido Midi (Azul · M)',
          subtotal: 180,
          orderId: null,
          updatedAt: '2026-11-14T18:00:00',
        },
      ]),
    );
    renderPage();

    expect(await screen.findByText('Maria da Silva')).toBeInTheDocument();
    expect(listCheckoutLeads).toHaveBeenCalledWith({ onlyOpen: true, pageNumber: 0, pageSize: 20 });
    expect(screen.getByText('2x Vestido Midi (Azul · M)')).toBeInTheDocument();
    expect(screen.getByText('Sem pedido', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute(
      'href',
      'https://wa.me/5581912345678',
    );
  });

  it('"Todos" mostra também os que criaram pedido, com link para o pedido', async () => {
    listCheckoutLeads.mockResolvedValueOnce(page([]));
    renderPage();
    expect(await screen.findByText('Nenhum checkout')).toBeInTheDocument();

    listCheckoutLeads.mockResolvedValueOnce(
      page([
        {
          id: 2,
          name: 'Ana',
          email: 'ana@exemplo.com',
          phone: '(61) 99999-0000',
          orderId: 88,
          orderStatus: 'AGUARDANDO_PAGAMENTO',
          updatedAt: '2026-11-14T18:00:00',
        },
      ]),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Todos' }));

    await waitFor(() =>
      expect(listCheckoutLeads).toHaveBeenLastCalledWith({
        onlyOpen: false,
        pageNumber: 0,
        pageSize: 20,
      }),
    );
    expect(await screen.findByRole('link', { name: /Pedido #88/ })).toHaveAttribute(
      'href',
      '/admin/pedidos/88',
    );
  });
});
