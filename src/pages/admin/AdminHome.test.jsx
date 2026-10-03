import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/services/adminService', () => ({
  getLowStock: vi.fn(),
  getStuckPaymentsCount: vi.fn(),
}));

import { getLowStock, getStuckPaymentsCount } from '@/services/adminService';
import AdminHome from './AdminHome';

describe('AdminHome', () => {
  beforeEach(() => {
    getLowStock.mockResolvedValue([]);
  });

  it('não mostra aviso de pagamentos travados quando a contagem é zero', async () => {
    getStuckPaymentsCount.mockResolvedValue(0);
    renderWithProviders(<AdminHome />);

    await screen.findByText('Nenhuma variação com estoque baixo.');
    expect(screen.queryByText(/pagamento travado/)).not.toBeInTheDocument();
  });

  it('mostra aviso de pagamentos travados (plural) quando a contagem é maior que 1', async () => {
    getStuckPaymentsCount.mockResolvedValue(2);
    renderWithProviders(<AdminHome />);

    expect(await screen.findByText('2 pagamentos travados')).toBeInTheDocument();
  });

  it('usa singular quando a contagem é 1', async () => {
    getStuckPaymentsCount.mockResolvedValue(1);
    renderWithProviders(<AdminHome />);

    expect(await screen.findByText('1 pagamento travado')).toBeInTheDocument();
  });

  it('não quebra a tela se a busca da contagem falhar', async () => {
    getStuckPaymentsCount.mockRejectedValue(new Error('falhou'));
    renderWithProviders(<AdminHome />);

    await screen.findByText('Nenhuma variação com estoque baixo.');
    expect(screen.queryByText(/pagamento travado/)).not.toBeInTheDocument();
  });
});
