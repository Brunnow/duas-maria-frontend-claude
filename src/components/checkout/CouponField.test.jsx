import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/services/couponService', () => ({ validateCoupon: vi.fn() }));

import { validateCoupon } from '@/services/couponService';
import CouponField from './CouponField';

beforeEach(() => vi.clearAllMocks());

describe('CouponField', () => {
  it('valida um cupom e repassa code + discountAmount ao pai', async () => {
    validateCoupon.mockResolvedValue({
      code: 'PROMO10',
      discountType: 'PERCENT',
      discountValue: 10,
      discountAmount: 20,
      subtotal: 200,
      subtotalAfterDiscount: 180,
    });
    const onApply = vi.fn();
    render(<CouponField value={null} onApply={onApply} onRemove={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Cupom de desconto'), { target: { value: 'promo10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    await waitFor(() => expect(validateCoupon).toHaveBeenCalledWith('promo10'));
    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith({ code: 'PROMO10', discountAmount: 20 }),
    );
  });

  it('mostra a mensagem do backend quando o cupom é inválido', async () => {
    validateCoupon.mockRejectedValue({ response: { data: { message: 'Cupom expirado.' } } });
    const onApply = vi.fn();
    render(<CouponField value={null} onApply={onApply} onRemove={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Cupom de desconto'), { target: { value: 'OLD' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(await screen.findByText('Cupom expirado.')).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  it('com cupom aplicado, mostra o resumo e permite remover', () => {
    const onRemove = vi.fn();
    render(
      <CouponField
        value={{ code: 'PROMO10', discountAmount: 20 }}
        onApply={vi.fn()}
        onRemove={onRemove}
      />,
    );

    expect(screen.getByText(/PROMO10/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*20,00/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }));
    expect(onRemove).toHaveBeenCalled();
  });
});
