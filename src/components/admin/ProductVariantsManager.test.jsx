import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

vi.mock('@/services/adminService', () => ({
  getVariants: vi.fn(),
  createVariants: vi.fn(),
  deleteVariant: vi.fn(),
  recountStock: vi.fn(),
  registerMovement: vi.fn(),
  renameColor: vi.fn(),
  deleteColor: vi.fn(),
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

  it('numeracao de jeans aparece em ordem crescente e pode ser adicionada', async () => {
    adminService.getVariants.mockResolvedValue([variant(2, '40', 3), variant(1, '36', 5)]);
    adminService.createVariants.mockResolvedValue([]);
    render(<ProductVariantsManager productId={7} />);

    const rows = await screen.findAllByText(/^Tamanho \d+/);
    expect(rows.map((r) => r.textContent.match(/^Tamanho \d+/)[0])).toEqual([
      'Tamanho 36',
      'Tamanho 40',
    ]);
    const select = screen.getByLabelText('Adicionar tamanho');
    expect(select.querySelector('optgroup[label="Numeração"] option[value="38"]')).not.toBeNull();
    expect(select.querySelector('option[value="36"]')).toBeNull(); // já cadastrado
    expect(select.querySelector('option[value="Único"]')).toBeNull(); // já tem grade

    fireEvent.change(select, { target: { value: '38' } });
    fireEvent.change(screen.getByLabelText('Estoque inicial'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    await waitFor(() =>
      expect(adminService.createVariants).toHaveBeenCalledWith(7, [
        { size: '38', initialStock: 4 },
      ]),
    );
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

  describe('cores', () => {
    const colored = (id, color, size, stock, colorHex = null) => ({
      ...variant(id, size, stock),
      color,
      colorHex,
    });

    it('produto com cor mostra um bloco por cor, na ordem de criacao', async () => {
      adminService.getVariants.mockResolvedValue([
        colored(3, 'Azul', 'P', 1, '#1565C0'),
        colored(1, 'Verde', 'M', 2),
        colored(2, 'Verde', 'P', 0),
      ]);
      render(<ProductVariantsManager productId={7} />);

      const verde = await screen.findByRole('region', { name: 'Cor Verde' });
      const azul = screen.getByRole('region', { name: 'Cor Azul' });
      expect(verde.compareDocumentPosition(azul) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(
        Array.from(verde.querySelectorAll('li p:first-child')).map((p) =>
          p.textContent.replace(/\s+/g, ' ').trim(),
        ),
      ).toEqual(['Tamanho P Esgotado', 'Tamanho M Baixo · 2']);
      expect(screen.getByText('Cores, tamanhos e estoque')).toBeInTheDocument();
    });

    it('adicionar tamanho dentro de uma cor envia a cor', async () => {
      adminService.getVariants.mockResolvedValue([colored(1, 'Verde', 'M', 2)]);
      adminService.createVariants.mockResolvedValue([]);
      render(<ProductVariantsManager productId={7} />);

      fireEvent.change(await screen.findByLabelText('Adicionar tamanho (Verde)'), {
        target: { value: 'G' },
      });
      fireEvent.change(screen.getByLabelText('Estoque inicial (Verde)'), {
        target: { value: '1' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

      await waitFor(() =>
        expect(adminService.createVariants).toHaveBeenCalledWith(
          7,
          [{ size: 'G', initialStock: 1 }],
          { color: 'Verde' },
        ),
      );
    });

    it('editar cor chama renameColor com o nome atual e a bolinha', async () => {
      adminService.getVariants.mockResolvedValue([colored(1, 'Verde', 'M', 2)]);
      adminService.renameColor.mockResolvedValue([]);
      render(<ProductVariantsManager productId={7} />);

      fireEvent.click(await screen.findByRole('button', { name: 'Editar cor Verde' }));
      fireEvent.change(screen.getByLabelText('Nome da cor'), { target: { value: 'Verde musgo' } });
      fireEvent.click(screen.getByLabelText('Bolinha de cor'));
      fireEvent.click(screen.getByRole('button', { name: 'Salvar cor' }));

      await waitFor(() =>
        expect(adminService.renameColor).toHaveBeenCalledWith(7, {
          currentName: 'Verde',
          name: 'Verde musgo',
          hex: '#1F1F1F',
        }),
      );
    });

    it('produto sem cor: adicionar cor pede a cor atual, nomeia e cria a nova grade', async () => {
      adminService.getVariants.mockResolvedValue([variant(1, 'M', 2)]);
      adminService.renameColor.mockResolvedValue([]);
      adminService.createVariants.mockResolvedValue([]);
      render(<ProductVariantsManager productId={7} />);

      fireEvent.click(await screen.findByRole('button', { name: 'Adicionar cor' }));
      const form = screen.getByRole('form', { name: 'Adicionar cor' });
      fireEvent.change(within(form).getByLabelText('Cor atual'), { target: { value: 'Azul' } });
      fireEvent.change(within(form).getByLabelText('Nome da nova cor'), {
        target: { value: 'Verde' },
      });
      fireEvent.click(within(form).getByLabelText('Tamanho P'));
      fireEvent.change(within(form).getByLabelText('Estoque inicial P'), {
        target: { value: '3' },
      });
      fireEvent.click(within(form).getByRole('button', { name: 'Salvar cor' }));

      await waitFor(() => expect(adminService.createVariants).toHaveBeenCalled());
      expect(adminService.renameColor).toHaveBeenCalledWith(7, {
        currentName: '',
        name: 'Azul',
        hex: null,
      });
      expect(adminService.createVariants).toHaveBeenCalledWith(
        7,
        [{ size: 'P', initialStock: 3 }],
        { color: 'Verde', colorHex: null },
      );
      expect(adminService.renameColor.mock.invocationCallOrder[0]).toBeLessThan(
        adminService.createVariants.mock.invocationCallOrder[0],
      );
    });

    it('nova cor sem tamanho marcado nao chama a API', async () => {
      adminService.getVariants.mockResolvedValue([]);
      render(<ProductVariantsManager productId={7} />);

      fireEvent.click(await screen.findByRole('button', { name: 'Adicionar cor' }));
      const form = screen.getByRole('form', { name: 'Adicionar cor' });
      fireEvent.change(within(form).getByLabelText('Nome da nova cor'), {
        target: { value: 'Verde' },
      });
      fireEvent.click(within(form).getByRole('button', { name: 'Salvar cor' }));

      expect(
        await within(form).findByText('Marque ao menos um tamanho da nova cor.'),
      ).toBeInTheDocument();
      expect(adminService.createVariants).not.toHaveBeenCalled();
      expect(within(form).queryByLabelText('Cor atual')).not.toBeInTheDocument();
    });

    it('excluir cor pede confirmacao (com tamanhos e estoque) e avisa quem esta em volta', async () => {
      adminService.getVariants
        .mockResolvedValueOnce([colored(1, 'Verde', 'P', 2), colored(2, 'Azul', 'M', 0)])
        .mockResolvedValueOnce([colored(2, 'Azul', 'M', 0)]);
      adminService.deleteColor.mockResolvedValue([]);
      const onChanged = vi.fn();
      render(<ProductVariantsManager productId={7} onChanged={onChanged} />);

      fireEvent.click(await screen.findByRole('button', { name: 'Excluir cor Verde' }));
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText(/tamanhos P \(2 peças em estoque\)/)).toBeInTheDocument();
      fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir cor' }));

      await waitFor(() => expect(adminService.deleteColor).toHaveBeenCalledWith(7, 'Verde'));
      await waitFor(() =>
        expect(screen.queryByRole('region', { name: 'Cor Verde' })).not.toBeInTheDocument(),
      );
      expect(onChanged).toHaveBeenCalled();
    });

    it('excluir cor com tamanho vendido mostra o motivo no dialogo', async () => {
      adminService.getVariants.mockResolvedValue([colored(1, 'Verde', 'P', 0)]);
      adminService.deleteColor.mockRejectedValue({
        response: {
          data: {
            message: 'A cor Verde não pode ser excluída: o(s) tamanho(s) P já foram vendidos.',
          },
        },
      });
      render(<ProductVariantsManager productId={7} />);

      fireEvent.click(await screen.findByRole('button', { name: 'Excluir cor Verde' }));
      const dialog = await screen.findByRole('dialog');
      fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir cor' }));

      expect(await within(dialog).findByText(/já foram vendidos/)).toBeInTheDocument();
      // a cor continua lá (atrás do diálogo, por isso hidden: true)
      expect(screen.getByRole('region', { name: 'Cor Verde', hidden: true })).toBeInTheDocument();
    });
  });
});
