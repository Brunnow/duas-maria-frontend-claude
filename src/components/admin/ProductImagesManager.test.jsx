import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/services/adminService', () => ({
  listProductImages: vi.fn(),
  uploadProductImages: vi.fn(),
  deleteProductImage: vi.fn(),
  setPrimaryProductImage: vi.fn(),
  reorderProductImages: vi.fn(),
  getVariants: vi.fn(),
  setProductImageColor: vi.fn(),
}));

import * as adminService from '@/services/adminService';
import ProductImagesManager from './ProductImagesManager';

const img = (id, primary = false, position = id - 1) => ({
  imageId: id,
  url: `http://x/${id}.jpg`,
  alt: null,
  primary,
  position,
});

beforeEach(() => {
  vi.clearAllMocks();
  adminService.getVariants.mockResolvedValue([]); // produto sem cor
});

describe('ProductImagesManager', () => {
  it('lista as imagens e marca a principal', async () => {
    adminService.listProductImages.mockResolvedValue([img(1, true), img(2)]);
    render(<ProductImagesManager productId={7} onClose={() => {}} />);

    expect(await screen.findByText('Principal')).toBeInTheDocument();
    expect(screen.getByText(/2\/8/)).toBeInTheDocument();
  });

  it('estado vazio quando nao ha imagens', async () => {
    adminService.listProductImages.mockResolvedValue([]);
    render(<ProductImagesManager productId={7} onClose={() => {}} />);
    expect(await screen.findByText(/Nenhuma imagem ainda/)).toBeInTheDocument();
  });

  it('envia os arquivos selecionados (copiados antes de limpar o input) e atualiza a lista', async () => {
    adminService.listProductImages.mockResolvedValue([]);
    adminService.uploadProductImages.mockResolvedValue([img(1, true)]);
    render(<ProductImagesManager productId={7} onClose={() => {}} />);
    await screen.findByText(/Nenhuma imagem ainda/);

    const file = new File(['x'], 'foto.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(adminService.uploadProductImages).toHaveBeenCalledTimes(1));
    const [pid, sentFiles] = adminService.uploadProductImages.mock.calls[0];
    expect(pid).toBe(7);
    expect(Array.from(sentFiles)).toHaveLength(1);
    expect(Array.from(sentFiles)[0]).toBeInstanceOf(File);
    await waitFor(() => expect(screen.getByText('Principal')).toBeInTheDocument());
  });

  it('define a principal e usa a lista devolvida pelo backend', async () => {
    adminService.listProductImages.mockResolvedValue([img(1, true), img(2)]);
    adminService.setPrimaryProductImage.mockResolvedValue([img(1), img(2, true)]);
    render(<ProductImagesManager productId={7} onClose={() => {}} />);

    await screen.findByText('Principal');
    fireEvent.click(screen.getAllByRole('button', { name: 'Tornar principal' })[1]);

    await waitFor(() => expect(adminService.setPrimaryProductImage).toHaveBeenCalledWith(7, 2));
  });

  it('exclui uma imagem', async () => {
    adminService.listProductImages.mockResolvedValue([img(1, true), img(2)]);
    adminService.deleteProductImage.mockResolvedValue([img(1, true)]);
    render(<ProductImagesManager productId={7} onClose={() => {}} />);

    await screen.findByText('Principal');
    fireEvent.click(screen.getAllByRole('button', { name: 'Excluir imagem' })[1]);

    await waitFor(() => expect(adminService.deleteProductImage).toHaveBeenCalledWith(7, 2));
    await waitFor(() => expect(screen.getByText(/1\/8/)).toBeInTheDocument());
  });

  it('reordena chamando o backend com a nova ordem de ids', async () => {
    adminService.listProductImages.mockResolvedValue([img(1, true), img(2), img(3)]);
    adminService.reorderProductImages.mockResolvedValue([img(2), img(1, true), img(3)]);
    render(<ProductImagesManager productId={7} onClose={() => {}} />);

    await screen.findByText('Principal');
    // desce a primeira imagem
    fireEvent.click(screen.getAllByRole('button', { name: 'Mover para frente' })[0]);

    await waitFor(() =>
      expect(adminService.reorderProductImages).toHaveBeenCalledWith(7, [2, 1, 3]),
    );
  });

  it('mostra a mensagem de erro do backend', async () => {
    adminService.listProductImages.mockResolvedValue([]);
    adminService.uploadProductImages.mockRejectedValue({
      response: { data: { message: 'Máximo de 8 imagens por produto.' } },
    });
    render(<ProductImagesManager productId={7} onClose={() => {}} />);

    await screen.findByText(/Nenhuma imagem ainda/);
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, {
      target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] },
    });

    expect(await screen.findByText('Máximo de 8 imagens por produto.')).toBeInTheDocument();
  });

  describe('cores', () => {
    const colors = [
      { variantId: 1, size: 'M', color: 'Verde', colorHex: null },
      { variantId: 2, size: 'M', color: 'Azul', colorHex: '#1565C0' },
    ];

    it('envia as fotos na cor escolhida', async () => {
      adminService.getVariants.mockResolvedValue(colors);
      adminService.listProductImages.mockResolvedValue([]);
      adminService.uploadProductImages.mockResolvedValue([]);
      render(<ProductImagesManager productId={7} onClose={() => {}} />);

      const select = await screen.findByLabelText('Cor das fotos');
      expect(select.value).toBe('Verde'); // primeira cor por padrão
      fireEvent.change(select, { target: { value: 'Azul' } });
      const file = new File(['x'], 'foto.png', { type: 'image/png' });
      fireEvent.change(document.querySelector('input[type="file"]'), { target: { files: [file] } });

      await waitFor(() => expect(adminService.uploadProductImages).toHaveBeenCalledTimes(1));
      expect(adminService.uploadProductImages.mock.calls[0][0]).toBe(7);
      expect(adminService.uploadProductImages.mock.calls[0][2]).toBe('Azul');
    });

    it('troca a cor de uma foto', async () => {
      adminService.getVariants.mockResolvedValue(colors);
      adminService.listProductImages.mockResolvedValue([{ ...img(1, true), color: 'Verde' }]);
      adminService.setProductImageColor.mockResolvedValue([{ ...img(1, true), color: null }]);
      render(<ProductImagesManager productId={7} onClose={() => {}} />);

      const select = await screen.findByLabelText('Cor da foto 1');
      expect(select.value).toBe('Verde');
      fireEvent.change(select, { target: { value: '' } });

      await waitFor(() => expect(adminService.setProductImageColor).toHaveBeenCalledWith(7, 1, ''));
      await waitFor(() => expect(screen.getByLabelText('Cor da foto 1').value).toBe(''));
    });

    it('o limite de 8 vale por cor', async () => {
      adminService.getVariants.mockResolvedValue(colors);
      const verdes = Array.from({ length: 8 }, (_, i) => ({
        ...img(i + 1, i === 0),
        color: 'Verde',
      }));
      adminService.listProductImages.mockResolvedValue(verdes);
      render(<ProductImagesManager productId={7} onClose={() => {}} />);

      const send = await screen.findByRole('button', { name: /Enviar imagens/ });
      await waitFor(() => expect(send).toBeDisabled());
      fireEvent.change(screen.getByLabelText('Cor das fotos'), { target: { value: 'Azul' } });
      expect(send).not.toBeDisabled();
      expect(screen.getByText(/0\/8 em Azul/)).toBeInTheDocument();
    });

    it('produto sem cor nao mostra os seletores de cor', async () => {
      adminService.listProductImages.mockResolvedValue([img(1, true)]);
      render(<ProductImagesManager productId={7} onClose={() => {}} />);

      await screen.findByText('Principal');
      expect(screen.queryByLabelText('Cor das fotos')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Cor da foto 1')).not.toBeInTheDocument();
    });
  });
});
