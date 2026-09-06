import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

/*
 * Movimentação manual de estoque de uma variante. NÃO calcula estoque no
 * cliente — só monta o corpo e chama adminService.registerMovement, que
 * bate no StockService (única fonte de escrita de estoque).
 *
 * Tipos permitidos pelo painel (SALE_WEB e INITIAL são internos):
 *   SALE_STORE  saída  (venda no balcão)
 *   LOSS        saída  (perda / avaria)
 *   RETURN      entrada (devolução ao estoque)
 *   ADJUSTMENT  ajuste (delta com sinal; pode ser negativo)
 * A recontagem de inventário (RECOUNT) tem ação própria fora deste modal.
 */
const TYPES = [
  { value: 'SALE_STORE', label: 'Venda na loja física (saída)' },
  { value: 'LOSS', label: 'Perda / avaria (saída)' },
  { value: 'RETURN', label: 'Devolução ao estoque (entrada)' },
  { value: 'ADJUSTMENT', label: 'Ajuste manual (com sinal)' },
];

export default function StockMovementModal({ open, variant, onClose, onSubmit, submitting }) {
  const [type, setType] = useState('SALE_STORE');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);

  const reset = () => {
    setType('SALE_STORE');
    setQuantity('1');
    setNote('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = async () => {
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty === 0) {
      setError('Informe uma quantidade inteira diferente de zero.');
      return;
    }
    if (type !== 'ADJUSTMENT' && qty < 0) {
      setError('Para este tipo, a quantidade deve ser positiva (o sistema aplica o sinal).');
      return;
    }
    setError(null);
    try {
      await onSubmit({ type, quantity: qty, note: note.trim() || undefined });
      reset();
    } catch (err) {
      setError(err?.response?.data?.message || 'Não foi possível registrar a movimentação.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={variant ? `Movimentar estoque — Tamanho ${variant.size}` : 'Movimentar estoque'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} loading={submitting}>
            Registrar
          </Button>
        </>
      }
    >
      {variant && (
        <p className="mb-4 text-sm text-muted">
          {variant.sku} · estoque atual <span className="text-foreground">{variant.stock}</span>
        </p>
      )}
      <div className="flex flex-col gap-4">
        <Select label="Tipo" value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        <Input
          label="Quantidade"
          type="number"
          step="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          hint={
            type === 'ADJUSTMENT'
              ? 'Use um número negativo para reduzir o estoque.'
              : 'Sempre positivo; o tipo define entrada ou saída.'
          }
        />
        <Input
          label="Observação (opcional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
