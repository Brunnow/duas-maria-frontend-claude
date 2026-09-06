import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/services/adminService', () => ({
  listProductImages: vi.fn(),
  uploadProductImages: vi.fn(),
  deleteProductImage: vi.fn(),
  setPrimaryProductImage: vi.fn(),
  reorderProductImages: vi.fn(),
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

beforeEach(() => vi.clearAllMocks());

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
});
