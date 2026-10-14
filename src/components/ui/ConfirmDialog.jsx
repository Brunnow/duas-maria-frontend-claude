import { useState } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

/**
 * Confirmação de ação destrutiva (substitui o window.confirm nativo, que no
 * celular é uma caixa crua do navegador e não mostra erro nenhum).
 *
 * `onConfirm` pode ser assíncrona: o diálogo fica aberto com loading enquanto
 * ela roda, fecha no sucesso e mostra a mensagem do backend no erro — junto
 * do botão, onde a pessoa está olhando.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Excluir',
  errorFallback = 'Não foi possível concluir a ação.',
  onConfirm,
  onClose,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const close = () => {
    if (busy) return;
    setError(null);
    onClose();
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      setBusy(false);
      onClose();
    } catch (err) {
      setBusy(false);
      setError(err?.response?.data?.message || errorFallback);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      size="md"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
          <Button variant="secondary" onClick={close} disabled={busy} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirm} loading={busy} className="w-full sm:w-auto">
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex gap-3">
        <FiAlertTriangle className="mt-0.5 shrink-0 text-danger" size={20} aria-hidden="true" />
        <div className="text-sm text-foreground">{description}</div>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}
    </Modal>
  );
}
