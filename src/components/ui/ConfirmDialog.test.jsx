import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ConfirmDialog from './ConfirmDialog';

function renderDialog(props = {}) {
  const onClose = vi.fn();
  const onConfirm = vi.fn();
  render(
    <ConfirmDialog
      open
      title="Excluir categoria"
      description="Tem certeza?"
      confirmLabel="Excluir categoria"
      onConfirm={onConfirm}
      onClose={onClose}
      {...props}
    />,
  );
  return { onClose, onConfirm };
}

describe('ConfirmDialog', () => {
  it('confirma e fecha no sucesso', async () => {
    const onConfirm = vi.fn().mockResolvedValue();
    const { onClose } = renderDialog({ onConfirm });

    fireEvent.click(screen.getByRole('button', { name: 'Excluir categoria' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('mostra o erro do backend e continua aberto', async () => {
    const onConfirm = vi
      .fn()
      .mockRejectedValue({ response: { data: { message: 'Categoria possui produtos.' } } });
    const { onClose } = renderDialog({ onConfirm });

    fireEvent.click(screen.getByRole('button', { name: 'Excluir categoria' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Categoria possui produtos.');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('usa a mensagem padrão quando o erro não tem mensagem', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('Network Error'));
    renderDialog({ onConfirm, errorFallback: 'Não foi possível excluir a categoria.' });

    fireEvent.click(screen.getByRole('button', { name: 'Excluir categoria' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível excluir a categoria.',
    );
  });
});
