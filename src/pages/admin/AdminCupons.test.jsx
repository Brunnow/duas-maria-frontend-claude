import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { adminAuth, renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/services/adminCouponService', () => ({
  listCoupons: vi.fn(),
  createCoupon: vi.fn(),
  updateCoupon: vi.fn(),
  deleteCoupon: vi.fn(),
}));

import * as svc from '@/services/adminCouponService';
import AdminCupons from './AdminCupons';

const coupon = {
  id: 1,
  code: 'PROMO10',
  description: '10 off',
  discountType: 'PERCENT',
  discountValue: 10,
  minOrderAmount: null,
  startsAt: null,
  endsAt: null,
  maxRedemptions: 100,
  maxRedemptionsPerUser: 1,
  active: true,
  redemptionCount: 3,
};

beforeEach(() => vi.clearAllMocks());

describe('AdminCupons', () => {
  it('lista os cupons com código, desconto e usos', async () => {
    svc.listCoupons.mockResolvedValue([coupon]);
    renderWithProviders(<AdminCupons />, { preloadedState: adminAuth });

    expect(await screen.findByText('PROMO10')).toBeInTheDocument();
    expect(screen.getByText(/10% · 3 usos\/100/)).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('cria um cupom pelo formulário', async () => {
    svc.listCoupons.mockResolvedValue([]);
    svc.createCoupon.mockResolvedValue({ ...coupon, id: 2, code: 'NATAL' });
    renderWithProviders(<AdminCupons />, { preloadedState: adminAuth });
    await screen.findByText('Nenhum cupom');

    fireEvent.click(screen.getByRole('button', { name: 'Novo cupom' }));
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'natal' } });
    fireEvent.change(screen.getByLabelText('Valor (%)'), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar cupom' }));

    await waitFor(() =>
      expect(svc.createCoupon).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'natal',
          discountType: 'PERCENT',
          discountValue: 15,
          active: true,
        }),
      ),
    );
  });

  it('desativa um cupom', async () => {
    svc.listCoupons.mockResolvedValue([coupon]);
    svc.updateCoupon.mockResolvedValue({ ...coupon, active: false });
    renderWithProviders(<AdminCupons />, { preloadedState: adminAuth });
    await screen.findByText('PROMO10');

    fireEvent.click(screen.getByRole('button', { name: 'Desativar' }));

    await waitFor(() =>
      expect(svc.updateCoupon).toHaveBeenCalledWith(1, expect.objectContaining({ active: false })),
    );
  });

  it('mostra a mensagem do backend quando a exclusão é bloqueada', async () => {
    svc.listCoupons.mockResolvedValue([coupon]);
    svc.deleteCoupon.mockRejectedValue({
      response: {
        data: { message: 'Este cupom já foi utilizado em pedidos; desative-o em vez de excluir.' },
      },
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderWithProviders(<AdminCupons />, { preloadedState: adminAuth });
    await screen.findByText('PROMO10');

    fireEvent.click(screen.getByRole('button', { name: 'Excluir PROMO10' }));

    expect(await screen.findByText(/desative-o em vez de excluir/)).toBeInTheDocument();
  });
});
