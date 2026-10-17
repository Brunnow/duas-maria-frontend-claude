import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDate } from '@/lib/format';
import { RETURN_WINDOW_DAYS } from '@/lib/returnPolicy';
import { registerReturn } from '@/services/adminOrderService';
import { getProductVariants } from '@/services/productService';

const TYPES = [
  { value: 'TROCA', label: 'Trocar tamanho', hint: 'Mesmo produto, outro tamanho. Não mexe no dinheiro.' },
  { value: 'DEVOLUCAO', label: 'Devolver o dinheiro', hint: 'Estorna no Mercado Pago o valor das peças.' },
];

/*
 * Registro de troca/devolução depois que a peça voltou. As regras (prazo,
 * promoção, frete grátis, valor do estorno) são aplicadas no backend
 * (OrderReturnService); aqui só mostramos os avisos com base na elegibilidade
 * que o backend calculou, para a dona não precisar adivinhar.
 *
 * Montado só quando aberto: cada abertura começa com o formulário limpo.
 */
export default function OrderReturnModal({ orderId, eligibility, onClose, onDone }) {
  const [type, setType] = useState('TROCA');
  const [defective, setDefective] = useState(false);
  const [conditionChecked, setConditionChecked] = useState(false);
  const [note, setNote] = useState('');
  const [lines, setLines] = useState({}); // orderItemId -> { quantity, newVariantId, returnedVariantId }
  const [variantsByProduct, setVariantsByProduct] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const items = useMemo(() => eligibility.items || [], [eligibility.items]);

  // Tamanhos disponíveis para a troca (estoque atual), um pedido por produto.
  useEffect(() => {
    if (type !== 'TROCA') return undefined;
    let alive = true;
    const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean))];
    Promise.all(
      productIds.map((pid) =>
        getProductVariants(pid)
          .then((variants) => [pid, variants])
          .catch(() => [pid, []]),
      ),
    ).then((entries) => {
      if (alive) setVariantsByProduct(Object.fromEntries(entries));
    });
    return () => {
      alive = false;
    };
  }, [type, items]);

  const outOfWindow = !eligibility.withinWindow;
  const blockedByWindow = outOfWindow && !defective;
  const freeShipping = defective || eligibility.freeShippingAvailable;

  const lineBlocked = (item) => {
    if (item.returnableQuantity <= 0) return 'Já devolvida';
    if (type === 'TROCA' && item.onSale && !defective) return 'Promoção: sem troca';
    return null;
  };

  const toggle = (item) => {
    setLines((prev) => {
      const next = { ...prev };
      if (next[item.orderItemId]) {
        delete next[item.orderItemId];
      } else {
        next[item.orderItemId] = {
          quantity: 1,
          newVariantId: '',
          returnedVariantId:
            item.heldVariants.length === 1 ? String(item.heldVariants[0].variantId) : '',
        };
      }
      return next;
    });
  };

  const updateLine = (orderItemId, patch) =>
    setLines((prev) => ({ ...prev, [orderItemId]: { ...prev[orderItemId], ...patch } }));

  const selected = items.filter((i) => lines[i.orderItemId] && !lineBlocked(i));
  const missingNewSize = type === 'TROCA' && selected.some((i) => !lines[i.orderItemId].newVariantId);
  const missingReturned = selected.some(
    (i) => i.heldVariants.length > 1 && !lines[i.orderItemId].returnedVariantId,
  );
  const canSubmit =
    selected.length > 0 &&
    !blockedByWindow &&
    (defective || conditionChecked) &&
    !missingNewSize &&
    !missingReturned &&
    (type === 'TROCA' || eligibility.refundAvailable);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const detail = await registerReturn(orderId, {
        type,
        defective,
        conditionChecked: defective || conditionChecked,
        note: note.trim() || undefined,
        items: selected.map((i) => {
          const line = lines[i.orderItemId];
          return {
            orderItemId: i.orderItemId,
            quantity: Number(line.quantity),
            newVariantId: type === 'TROCA' ? Number(line.newVariantId) : undefined,
            returnedVariantId:
              i.heldVariants.length > 1 ? Number(line.returnedVariantId) : undefined,
          };
        }),
      });
      onDone(detail);
    } catch (err) {
      setError(err?.response?.data?.message || 'Não foi possível registrar agora. Tente de novo.');
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={submitting ? () => {} : onClose}
      title="Registrar troca ou devolução"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={submitting} disabled={!canSubmit}>
            {type === 'TROCA' ? 'Registrar troca' : 'Registrar e estornar'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 text-sm">
        <p className="text-muted">
          Use depois que a peça chegou e foi conferida. O estoque é atualizado sozinho
          {type === 'DEVOLUCAO' ? ' e o estorno sai na hora no Mercado Pago' : ''}.
        </p>

        <fieldset className="grid gap-2 sm:grid-cols-2">
          <legend className="sr-only">O que fazer</legend>
          {TYPES.map((t) => {
            const disabled = t.value === 'DEVOLUCAO' && !eligibility.refundAvailable;
            return (
              <label
                key={t.value}
                className={cn(
                  'flex cursor-pointer flex-col gap-0.5 rounded-card border p-3 transition-colors',
                  type === t.value ? 'border-foreground' : 'border-border hover:border-foreground/30',
                  disabled && 'cursor-not-allowed opacity-50',
                )}
              >
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <input
                    type="radio"
                    name="return-type"
                    value={t.value}
                    checked={type === t.value}
                    disabled={disabled}
                    onChange={() => setType(t.value)}
                  />
                  {t.label}
                </span>
                <span className="text-xs text-muted">
                  {disabled ? 'Pagamento sem valor a estornar no Mercado Pago.' : t.hint}
                </span>
              </label>
            );
          })}
        </fieldset>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Peças que voltaram
          </p>
          <ul className="mt-2 flex flex-col divide-y divide-border border-y border-border">
            {items.map((item) => {
              const blocked = lineBlocked(item);
              const line = lines[item.orderItemId];
              const checked = Boolean(line) && !blocked;
              const sizeOptions = (variantsByProduct[item.productId] || []).filter(
                (v) =>
                  v.inStock &&
                  String(v.variantId) !== (line?.returnedVariantId || '') &&
                  v.size !== 'Único',
              );
              return (
                <li key={item.orderItemId} className="flex flex-col gap-3 py-3">
                  <label
                    className={cn(
                      'flex items-start gap-3',
                      blocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={checked}
                      disabled={Boolean(blocked)}
                      onChange={() => toggle(item)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-foreground">
                        {item.productName}
                        {item.size && <span className="text-muted"> · {item.size}</span>}
                      </span>
                      <span className="block text-xs text-muted">
                        {formatCurrency(item.unitPaid)} cada · pode voltar {item.returnableQuantity}{' '}
                        de {item.quantity}
                        {item.onSale && ' · em promoção'}
                      </span>
                    </span>
                    {blocked && <span className="shrink-0 text-xs text-warning">{blocked}</span>}
                  </label>

                  {checked && (
                    <div className="grid gap-3 pl-7 sm:grid-cols-3">
                      {item.returnableQuantity > 1 && (
                        <Select
                          label="Quantidade"
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(item.orderItemId, { quantity: Number(e.target.value) })
                          }
                        >
                          {Array.from({ length: item.returnableQuantity }, (_, n) => n + 1).map(
                            (n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ),
                          )}
                        </Select>
                      )}
                      {item.heldVariants.length > 1 && (
                        <Select
                          label="Tamanho que voltou"
                          value={line.returnedVariantId}
                          onChange={(e) =>
                            updateLine(item.orderItemId, { returnedVariantId: e.target.value })
                          }
                        >
                          <option value="">Selecione…</option>
                          {item.heldVariants.map((v) => (
                            <option key={v.variantId} value={v.variantId}>
                              {v.size}
                            </option>
                          ))}
                        </Select>
                      )}
                      {type === 'TROCA' && (
                        <Select
                          label="Novo tamanho"
                          value={line.newVariantId}
                          onChange={(e) =>
                            updateLine(item.orderItemId, { newVariantId: e.target.value })
                          }
                        >
                          <option value="">
                            {sizeOptions.length ? 'Selecione…' : 'Sem outro tamanho em estoque'}
                          </option>
                          {sizeOptions.map((v) => (
                            <option key={v.variantId} value={v.variantId}>
                              {v.size} ({v.stock} em estoque)
                            </option>
                          ))}
                        </Select>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={defective}
              onChange={(e) => setDefective(e.target.checked)}
            />
            <span>
              <span className="text-foreground">Peça com defeito</span>
              <span className="block text-xs text-muted">
                Libera prazo e promoção; o frete é sempre da loja.
              </span>
            </span>
          </label>
          {!defective && (
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={conditionChecked}
                onChange={(e) => setConditionChecked(e.target.checked)}
              />
              <span className="text-foreground">
                Conferi: a peça voltou com etiqueta e sem marcas de uso
              </span>
            </label>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="return-note"
            className="text-xs font-medium uppercase tracking-wider text-muted"
          >
            Observação (opcional)
          </label>
          <textarea
            id="return-note"
            rows={2}
            maxLength={300}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          />
        </div>

        <ul className="flex flex-col gap-1 rounded-card bg-subtle p-3 text-xs">
          <li className={blockedByWindow ? 'text-danger' : 'text-muted'}>
            {eligibility.deadline
              ? outOfWindow
                ? `Fora do prazo de ${RETURN_WINDOW_DAYS} dias (terminou em ${formatDate(eligibility.deadline)}).${defective ? ' Liberado por defeito.' : ' Só peça com defeito.'}`
                : `Dentro do prazo: até ${formatDate(eligibility.deadline)}.`
              : 'Sem data de entrega registrada: prazo não verificado.'}
          </li>
          <li className="text-muted">
            {freeShipping
              ? `Frete da volta por conta da loja${defective ? ' (defeito)' : ' (1ª troca/devolução deste pedido)'}.`
              : 'Frete da volta por conta da cliente (este pedido já usou a troca/devolução grátis).'}
          </li>
          {type === 'DEVOLUCAO' && (
            <li className="text-muted">
              O estorno é o valor das peças, com a parte do cupom descontada. Se todas as peças
              do pedido voltarem, o frete da compra também é devolvido. Ainda pode ser estornado:{' '}
              {formatCurrency(eligibility.refundableAmount)}.
            </li>
          )}
        </ul>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
