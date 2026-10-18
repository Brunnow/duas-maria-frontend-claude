import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/services/couponService', () => ({ validateCoupon: vi.fn() }));

import { validateCoupon } from '@/services/couponService';
import CouponField from './CouponField';

beforeEach(() => vi.clearAllMocks());

describe('CouponField', () => {
  it('valida um cupom e repassa a lista com code + discountAmount ao pai', async () => {
    validateCoupon.mockResolvedValue({
      code: 'PROMO10',
      discountType: 'PERCENT',
      discountValue: 10,
      discountAmount: 20,
      subtotal: 200,
      subtotalAfterDiscount: 180,
    });
    const onApply = vi.fn();
    render(<CouponField value={[]} onApply={onApply} onRemove={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Cupom de desconto'), { target: { value: 'promo10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    await waitFor(() => expect(validateCoupon).toHaveBeenCalledWith('promo10', []));
    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith([{ code: 'PROMO10', discountAmount: 20 }]),
    );
  });

  it('segundo cupom vai validado junto com o primeiro e usa a divisao do backend', async () => {
    validateCoupon.mockResolvedValue({
      code: 'PRIMEIRACOMPRA',
      discountAmount: 20,
      totalDiscountAmount: 60,
      coupons: [
        { code: 'ESQUENTA20', discountAmount: 40 },
        { code: 'PRIMEIRACOMPRA', discountAmount: 20 },
      ],
    });
    const onApply = vi.fn();
    render(
      <CouponField
        value={[{ code: 'ESQUENTA20', discountAmount: 40 }]}
        onApply={onApply}
        onRemove={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Tem outro cupom?'), {
      target: { value: 'primeiracompra' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    await waitFor(() =>
      expect(validateCoupon).toHaveBeenCalledWith('primeiracompra', ['ESQUENTA20']),
    );
    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith([
        { code: 'ESQUENTA20', discountAmount: 40 },
        { code: 'PRIMEIRACOMPRA', discountAmount: 20 },
      ]),
    );
  });

  it('mostra a mensagem do backend quando o cupom nao combina', async () => {
    validateCoupon.mockRejectedValue({
      response: { data: { message: 'O cupom PROMO10 não pode ser combinado com outro cupom.' } },
    });
    const onApply = vi.fn();
    render(
      <CouponField
        value={[{ code: 'ESQUENTA20', discountAmount: 40 }]}
        onApply={onApply}
        onRemove={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Tem outro cupom?'), { target: { value: 'PROMO10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(
      await screen.findByText('O cupom PROMO10 não pode ser combinado com outro cupom.'),
    ).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  it('com dois cupons, mostra os dois, permite remover cada um e esconde o campo', () => {
    const onRemove = vi.fn();
    render(
      <CouponField
        value={[
          { code: 'ESQUENTA20', discountAmount: 40 },
          { code: 'PRIMEIRACOMPRA', discountAmount: 20 },
        ]}
        onApply={vi.fn()}
        onRemove={onRemove}
      />,
    );

    expect(screen.getByText(/R\$\s*40,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*20,00/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aplicar' })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Remover' })[1]);
    expect(onRemove).toHaveBeenCalledWith('PRIMEIRACOMPRA');
  });
});
