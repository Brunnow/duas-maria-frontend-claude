import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatCurrency } from '@/lib/format';
import { validateCoupon } from '@/services/couponService';

/*
 * Campo de cupom do checkout. Valida no backend (POST /api/coupons/validate) e
 * repassa { code, discountAmount } ao pai via onApply. O valor é só um preview:
 * o backend recalcula o desconto ao criar o pedido.
 *
 * `value` = { code, discountAmount } | null (cupom já aplicado).
 */
export default function CouponField({ value, onApply, onRemove }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const apply = async (event) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      const preview = await validateCoupon(trimmed);
      onApply({ code: preview.code, discountAmount: Number(preview.discountAmount) || 0 });
      setCode('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Não foi possível validar o cupom.');
    } finally {
      setBusy(false);
    }
  };

  if (value) {
    return (
      <div className="mt-4 flex items-center justify-between gap-3 rounded-card border border-border bg-subtle p-3 text-sm">
        <span className="text-foreground">
          Cupom <span className="font-medium">{value.code}</span> aplicado — desconto de{' '}
          {formatCurrency(value.discountAmount)}
        </span>
        <Button variant="ghost" size="sm" type="button" onClick={onRemove}>
          Remover
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={apply} className="mt-4 flex items-end gap-3">
      <div className="flex-1">
        <Input
          label="Cupom de desconto"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Digite o código"
          error={error || undefined}
        />
      </div>
      <Button type="submit" variant="secondary" loading={busy} disabled={!code.trim()}>
        Aplicar
      </Button>
    </form>
  );
}
