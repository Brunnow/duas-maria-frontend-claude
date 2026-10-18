import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatCurrency } from '@/lib/format';
import { validateCoupon } from '@/services/couponService';

/** Decisão da dona (2026-10-18): até 2 cupons combináveis por pedido. */
export const MAX_COUPONS = 2;

/*
 * Campo de cupom do checkout. Valida no backend (POST /api/coupons/validate),
 * mandando junto os cupons já aplicados: o backend confere a combinação e
 * devolve a parte de cada um. O valor é só um preview: o backend recalcula o
 * desconto ao criar o pedido.
 *
 * `value` = [{ code, discountAmount }] (cupons já aplicados, em ordem).
 * `onApply(lista)` recebe a lista completa; `onRemove(code)` tira um.
 */
export default function CouponField({ value = [], onApply, onRemove }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const applied = Array.isArray(value) ? value : value ? [value] : [];
  const canAddMore = applied.length < MAX_COUPONS;

  const apply = async (event) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      const preview = await validateCoupon(
        trimmed,
        applied.map((c) => c.code),
      );
      const list =
        Array.isArray(preview.coupons) && preview.coupons.length > 0
          ? preview.coupons
          : [...applied, { code: preview.code, discountAmount: preview.discountAmount }];
      onApply(list.map((c) => ({ code: c.code, discountAmount: Number(c.discountAmount) || 0 })));
      setCode('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Não foi possível validar o cupom.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      {applied.map((c) => (
        <div
          key={c.code}
          className="flex items-center justify-between gap-3 rounded-card border border-border bg-subtle p-3 text-sm"
        >
          <span className="text-foreground">
            Cupom <span className="font-medium">{c.code}</span> aplicado — desconto de{' '}
            {formatCurrency(c.discountAmount)}
          </span>
          <Button variant="ghost" size="sm" type="button" onClick={() => onRemove(c.code)}>
            Remover
          </Button>
        </div>
      ))}

      {canAddMore && (
        <form onSubmit={apply} className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              label={applied.length === 0 ? 'Cupom de desconto' : 'Tem outro cupom?'}
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
      )}
    </div>
  );
}
