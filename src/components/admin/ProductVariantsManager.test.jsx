import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/services/adminService', () => ({
  getVariants: vi.fn(),
  createVariants: vi.fn(),
  deleteVariant: vi.fn(),
  recountStock: vi.fn(),
  registerMovement: vi.fn(),
}));

import * as adminService from '@/services/adminService';
import ProductVariantsManager from './ProductVariantsManager';

const variant = (id, size, stock) => ({
  variantId: id,
  productId: 7,
  size,
  sku: `SKU-${size}`,
  stock,
});

beforeEach(() => vi.clearAllMocks());

describe('ProductVariantsManager', () => {
  it('lista os tamanhos na ordem PP→GG com badge de estoque', async () => {
    adminService.getVariants.mockResolvedValue([
      variant(2, 'M', 0),
      variant(1, 'PP', 10),
      variant(3, 'G', 2),
    ]);
    render(<ProductVariantsManager productId={7} />);

    const rows = await screen.findAllByText(/^Tamanho (PP|M|G)/);
    expect(rows.map((r) => r.textContent.replace(/\s+/g, ' ').trim())).toEqual([
      'Tamanho PP 10',
      'Tamanho M Esgotado',
      'Tamanho G Baixo · 2',
    ]);
  });

  it('estado vazio quando nao ha grade', async () => {
    adminService.getVariants.mockResolvedValue([]);
    render(<ProductVariantsManager productId={7} />);
    expect(await screen.findByText(/ainda não tem grade de tamanhos/)).toBeInTheDocument();
  });

  it('adiciona um tamanho chamando createVariants e recarrega', async () => {
    adminService.getVariants.mockResolvedValueOnce([variant(1, 'M', 5)]);
    adminService.createVariants.mockResolvedValue([{ variantId: 2, size: 'G', stock: 3 }]);
    adminService.getVariants.mockResolvedValueOnce([variant(1, 'M', 5), variant(2, 'G', 3)]);
    render(<ProductVariantsManager productId={7} />);

    await screen.findByText(/^Tamanho M/);
    fireEvent.change(screen.getByLabelText('Adicionar tamanho'), { target: { value: 'G' } });
    fireEvent.change(screen.getByLabelText('Estoque inicial'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    await waitFor(() =>
      expect(adminService.createVariants).toHaveBeenCalledWith(7, [{ size: 'G', initialStock: 3 }]),
    );
    expect(await screen.findByText(/^Tamanho G/)).toBeInTheDocument();
  });

  it('recontagem chama recountStock com o valor informado', async () => {
    adminService.getVariants.mockResolvedValue([variant(1, 'M', 5)]);
    adminService.recountStock.mockResolvedValue({});
    render(<ProductVariantsManager productId={7} />);

    await screen.findByText(/^Tamanho M/);
    fireEvent.click(screen.getByRole('button', { name: 'Recontar' }));
    fireEvent.change(screen.getByLabelText('Novo estoque'), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar recontagem' }));

    await waitFor(() =>
      expect(adminService.recountStock).toHaveBeenCalledWith(7, 1, 8, 'Recontagem via painel'),
    );
  });

  it('movimentação de estoque passa pelo modal e chama registerMovement', async () => {
    adminService.getVariants.mockResolvedValue([variant(1, 'M', 5)]);
    adminService.registerMovement.mockResolvedValue({});
    render(<ProductVariantsManager productId={7} />);

    await screen.findByText(/^Tamanho M/);
    fireEvent.click(screen.getByRole('button', { name: 'Movimentar' }));
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'LOSS' } });
    fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    await waitFor(() =>
      expect(adminService.registerMovement).toHaveBeenCalledWith(7, 1, {
        type: 'LOSS',
        quantity: 2,
        note: undefined,
      }),
    );
  });

  it('mostra a mensagem amigavel do backend quando a exclusao e bloqueada', async () => {
    adminService.getVariants.mockResolvedValue([variant(1, 'M', 0)]);
    adminService.deleteVariant.mockRejectedValue({
      response: { data: { message: 'Variante 1 não pode ser removida: existe em pedidos.' } },
    });
    render(<ProductVariantsManager productId={7} />);

    await screen.findByText(/^Tamanho M/);
    fireEvent.click(screen.getByRole('button', { name: 'Remover tamanho M' }));

    expect(
      await screen.findByText('Variante 1 não pode ser removida: existe em pedidos.'),
    ).toBeInTheDocument();
  });
});
