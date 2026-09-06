import { useCallback, useState } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { useFetch } from '@/hooks/useFetch';
import * as adminCouponService from '@/services/adminCouponService';
import { formatCurrency, formatDateTime } from '@/lib/format';

const errText = (err, fallback) => err?.response?.data?.message || fallback;

const EMPTY_FORM = {
  code: '',
  description: '',
  discountType: 'PERCENT',
  discountValue: '',
  minOrderAmount: '',
  startsAt: '',
  endsAt: '',
  maxRedemptions: '',
  maxRedemptionsPerUser: '',
  active: true,
};

// "2026-09-06T14:30:00" -> "2026-09-06T14:30" (valor do input datetime-local)
const toLocalInput = (iso) => (iso ? String(iso).slice(0, 16) : '');

function fromCoupon(c) {
  return {
    code: c.code,
    description: c.description || '',
    discountType: c.discountType || 'PERCENT',
    discountValue: c.discountValue ?? '',
    minOrderAmount: c.minOrderAmount ?? '',
    startsAt: toLocalInput(c.startsAt),
    endsAt: toLocalInput(c.endsAt),
    maxRedemptions: c.maxRedemptions ?? '',
    maxRedemptionsPerUser: c.maxRedemptionsPerUser ?? '',
    active: c.active,
  };
}

function toBody(form) {
  const num = (v) => (v === '' || v == null ? undefined : Number(v));
  return {
    code: form.code.trim(),
    description: form.description.trim() || undefined,
    discountType: form.discountType,
    discountValue: num(form.discountValue),
    minOrderAmount: num(form.minOrderAmount),
    startsAt: form.startsAt || undefined,
    endsAt: form.endsAt || undefined,
    maxRedemptions: num(form.maxRedemptions),
    maxRedemptionsPerUser: num(form.maxRedemptionsPerUser),
    active: form.active,
  };
}

function discountLabel(c) {
  return c.discountType === 'PERCENT'
    ? `${Number(c.discountValue)}%`
    : formatCurrency(c.discountValue);
}

function couponSubtitle(c) {
  const parts = [discountLabel(c)];
  if (c.minOrderAmount != null) parts.push(`mín. ${formatCurrency(c.minOrderAmount)}`);
  const uses = `${c.redemptionCount} uso${c.redemptionCount === 1 ? '' : 's'}${
    c.maxRedemptions != null ? `/${c.maxRedemptions}` : ''
  }`;
  parts.push(uses);
  if (c.endsAt) parts.push(`até ${formatDateTime(c.endsAt)}`);
  return parts.join(' · ');
}

export default function AdminCupons() {
  const { status, data, error, refetch } = useFetch(adminCouponService.listCoupons, []);
  const list = data || [];

  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [rowBusy, setRowBusy] = useState(null);
  const [notice, setNotice] = useState(null);

  const set = (field) => (e) =>
    setForm((f) => ({
      ...f,
      [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditing('new');
    setNotice(null);
  };

  const openEdit = (coupon) => {
    setForm(fromCoupon(coupon));
    setEditing(coupon.id);
    setNotice(null);
  };

  const close = () => setEditing(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.code.trim() || form.discountValue === '') {
      setNotice('Informe ao menos o código e o valor do desconto.');
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      if (editing === 'new') {
        await adminCouponService.createCoupon(toBody(form));
        setNotice('Cupom criado.');
      } else {
        await adminCouponService.updateCoupon(editing, toBody(form));
        setNotice('Cupom atualizado.');
      }
      setEditing(null);
      refetch();
    } catch (err) {
      setNotice(errText(err, 'Não foi possível salvar o cupom.'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = useCallback(
    async (coupon) => {
      setRowBusy(coupon.id);
      setNotice(null);
      try {
        await adminCouponService.updateCoupon(coupon.id, {
          ...toBody(fromCoupon(coupon)),
          active: !coupon.active,
        });
        refetch();
      } catch (err) {
        setNotice(errText(err, 'Não foi possível alterar o cupom.'));
      } finally {
        setRowBusy(null);
      }
    },
    [refetch],
  );

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Excluir o cupom ${coupon.code}?`)) return;
    setRowBusy(coupon.id);
    setNotice(null);
    try {
      await adminCouponService.deleteCoupon(coupon.id);
      refetch();
    } catch (err) {
      setNotice(errText(err, 'Não foi possível excluir o cupom.'));
    } finally {
      setRowBusy(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl text-foreground">Cupons</h2>
        {editing === null && (
          <Button size="sm" onClick={openNew}>
            Novo cupom
          </Button>
        )}
      </div>

      {notice && (
        <p role="status" className="mt-3 text-sm text-muted">
          {notice}
        </p>
      )}

      {editing !== null && (
        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-4 rounded-card border border-border p-5 sm:grid-cols-2"
        >
          <Input label="Código" value={form.code} onChange={set('code')} />
          <Input label="Descrição" value={form.description} onChange={set('description')} />
          <Select label="Tipo de desconto" value={form.discountType} onChange={set('discountType')}>
            <option value="PERCENT">Percentual (%)</option>
            <option value="FIXED">Valor fixo (R$)</option>
          </Select>
          <Input
            label={form.discountType === 'PERCENT' ? 'Valor (%)' : 'Valor (R$)'}
            type="number"
            min="0"
            step="0.01"
            value={form.discountValue}
            onChange={set('discountValue')}
          />
          <Input
            label="Pedido mínimo (R$)"
            type="number"
            min="0"
            step="0.01"
            value={form.minOrderAmount}
            onChange={set('minOrderAmount')}
          />
          <div />
          <Input
            label="Válido a partir de"
            type="datetime-local"
            value={form.startsAt}
            onChange={set('startsAt')}
          />
          <Input
            label="Válido até"
            type="datetime-local"
            value={form.endsAt}
            onChange={set('endsAt')}
          />
          <Input
            label="Limite total de usos"
            type="number"
            min="1"
            value={form.maxRedemptions}
            onChange={set('maxRedemptions')}
          />
          <Input
            label="Limite por usuário"
            type="number"
            min="1"
            value={form.maxRedemptionsPerUser}
            onChange={set('maxRedemptionsPerUser')}
          />
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.active} onChange={set('active')} />
            Ativo
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" size="sm" loading={saving}>
              {editing === 'new' ? 'Criar cupom' : 'Salvar'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={close}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <div className="mt-5">
        {status === 'loading' ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : status === 'error' ? (
          <ErrorState
            message={error}
            action={
              <Button variant="secondary" size="sm" onClick={refetch}>
                Tentar novamente
              </Button>
            }
          />
        ) : list.length === 0 ? (
          <EmptyState title="Nenhum cupom" description="Crie o primeiro cupom de desconto." />
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {list.map((coupon) => (
              <li key={coupon.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {coupon.code}{' '}
                    <Badge tone={coupon.active ? 'success' : 'neutral'} className="ml-1">
                      {coupon.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </p>
                  <p className="text-xs text-muted">{couponSubtitle(coupon)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToggleActive(coupon)}
                    loading={rowBusy === coupon.id}
                  >
                    {coupon.active ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(coupon)}
                    aria-label={`Editar ${coupon.code}`}
                  >
                    <FiEdit2 size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(coupon)}
                    loading={rowBusy === coupon.id}
                    aria-label={`Excluir ${coupon.code}`}
                  >
                    <FiTrash2 size={15} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
