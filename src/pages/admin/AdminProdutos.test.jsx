import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { adminAuth, renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/store/actions', () => ({
  fetchCategories: () => () => {},
  fetchProducts: () => () => {},
}));
vi.mock('@/services/adminService', () => ({
  listProducts: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  changeProductCategory: vi.fn(),
  deleteProduct: vi.fn(),
  uploadProductImage: vi.fn(),
  listProductImages: vi.fn().mockResolvedValue([]),
  getVariants: vi.fn().mockResolvedValue([]),
  createVariants: vi.fn(),
  deleteVariant: vi.fn(),
  recountStock: vi.fn(),
  registerMovement: vi.fn(),
}));

import * as adminService from '@/services/adminService';
import AdminProdutos from './AdminProdutos';

const PAGE = {
  content: [
    {
      productId: 1,
      productName: 'Vestido Midi',
      image: 'a.jpg',
      price: 259.9,
      specialPrice: 259.9,
      stock: 10,
    },
  ],
  totalPages: 1,
};

const preloaded = {
  ...adminAuth,
  products: {
    products: null,
    categories: [{ categoryId: 7, categoryName: 'Vestidos' }],
    pagination: {},
  },
};

beforeEach(() => vi.clearAllMocks());

describe('AdminProdutos', () => {
  it('lista os produtos', async () => {
    adminService.listProducts.mockResolvedValue(PAGE);
    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    expect(await screen.findByText('Vestido Midi')).toBeInTheDocument();
  });

  it('exclui um produto após confirmar no diálogo', async () => {
    adminService.listProducts.mockResolvedValue(PAGE);
    adminService.deleteProduct.mockResolvedValue({});
    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    await screen.findByText('Vestido Midi');

    fireEvent.click(screen.getByRole('button', { name: 'Excluir Vestido Midi' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Vestido Midi');
    expect(adminService.deleteProduct).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Excluir produto' }));

    await waitFor(() => expect(adminService.deleteProduct).toHaveBeenCalledWith(1));
    expect(await screen.findByText('Produto “Vestido Midi” excluído.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('cancelar o diálogo não exclui', async () => {
    adminService.listProducts.mockResolvedValue(PAGE);
    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    await screen.findByText('Vestido Midi');

    fireEvent.click(screen.getByRole('button', { name: 'Excluir Vestido Midi' }));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(adminService.deleteProduct).not.toHaveBeenCalled();
  });

  it('cria um produto pelo formulario', async () => {
    adminService.listProducts.mockResolvedValue({ content: [], totalPages: 0 });
    adminService.createProduct.mockResolvedValue({ productId: 9 });

    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    await screen.findByText('Nenhum produto');

    fireEvent.click(screen.getByRole('button', { name: 'Novo produto' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Saia Longa Jeans' } });
    fireEvent.change(screen.getByLabelText('Descrição'), {
      target: { value: 'Saia longa em jeans' },
    });
    fireEvent.change(screen.getByLabelText('Preço (R$)'), { target: { value: '199.9' } });
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar produto' }));

    await waitFor(() =>
      expect(adminService.createProduct).toHaveBeenCalledWith(
        7,
        expect.objectContaining({
          productName: 'Saia Longa Jeans',
          price: 199.9,
          specialPrice: 199.9,
        }),
      ),
    );
    // Nenhum tamanho marcado -> não cria grade.
    expect(adminService.createVariants).not.toHaveBeenCalled();
  });

  it('depois de criar, abre o painel de fotos do produto novo e leva a tela ate ele', async () => {
    const scrollIntoView = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
    adminService.listProducts.mockResolvedValue({ content: [], totalPages: 0 });
    adminService.createProduct.mockResolvedValue({ productId: 9 });

    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    await screen.findByText('Nenhum produto');

    fireEvent.click(screen.getByRole('button', { name: 'Novo produto' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Saia Longa Jeans' } });
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Saia longa' } });
    fireEvent.change(screen.getByLabelText('Preço (R$)'), { target: { value: '199.9' } });
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '7' } });
    scrollIntoView.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Criar produto' }));

    expect(await screen.findByRole('heading', { name: 'Imagens do produto' })).toBeInTheDocument();
    await waitFor(() => expect(adminService.listProductImages).toHaveBeenCalledWith(9));
    expect(scrollIntoView).toHaveBeenCalled();
    expect(screen.getByText(/Adicione as fotos abaixo/)).toBeInTheDocument();
  });

  it('edita um produto e muda a categoria dele', async () => {
    adminService.listProducts.mockResolvedValue({
      ...PAGE,
      content: [{ ...PAGE.content[0], description: 'Vestido midi de linho' }],
    });
    adminService.updateProduct.mockResolvedValue({ productId: 1 });
    adminService.changeProductCategory.mockResolvedValue({ productId: 1 });

    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    await screen.findByText('Vestido Midi');

    fireEvent.click(screen.getByRole('button', { name: /Editar/ }));
    const select = screen.getByLabelText('Mudar categoria');
    expect(select).toHaveValue('');
    fireEvent.change(select, { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(adminService.changeProductCategory).toHaveBeenCalledWith(1, 7));
    expect(adminService.updateProduct).toHaveBeenCalled();
    expect(
      await screen.findByText('Produto atualizado e movido de categoria.'),
    ).toBeInTheDocument();
  });

  it('editar sem escolher categoria nao muda a categoria', async () => {
    adminService.listProducts.mockResolvedValue({
      ...PAGE,
      content: [{ ...PAGE.content[0], description: 'Vestido midi de linho' }],
    });
    adminService.updateProduct.mockResolvedValue({ productId: 1 });

    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    await screen.findByText('Vestido Midi');

    fireEvent.click(screen.getByRole('button', { name: /Editar/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(adminService.updateProduct).toHaveBeenCalled());
    expect(adminService.changeProductCategory).not.toHaveBeenCalled();
  });

  it('aceita preço com vírgula (teclado pt-BR do celular)', async () => {
    adminService.listProducts.mockResolvedValue({ content: [], totalPages: 0 });
    adminService.createProduct.mockResolvedValue({ productId: 9 });

    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    await screen.findByText('Nenhum produto');

    fireEvent.click(screen.getByRole('button', { name: 'Novo produto' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Blusa Linho' } });
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Blusa de linho' } });
    fireEvent.change(screen.getByLabelText('Preço (R$)'), { target: { value: '89,90' } });
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar produto' }));

    await waitFor(() =>
      expect(adminService.createProduct).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ price: 89.9, specialPrice: 89.9 }),
      ),
    );
  });

  it('aceita descrição maior que 255 caracteres (limite antigo)', async () => {
    adminService.listProducts.mockResolvedValue({ content: [], totalPages: 0 });
    adminService.createProduct.mockResolvedValue({ productId: 9 });
    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    await screen.findByText('Nenhum produto');

    const longText = 'Vestido em viscose. '.repeat(20); // 400 caracteres
    fireEvent.click(screen.getByRole('button', { name: 'Novo produto' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Vestido Longo' } });
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: longText } });
    fireEvent.change(screen.getByLabelText('Preço (R$)'), { target: { value: '199,90' } });
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '7' } });

    expect(screen.getByText('400 / 2000')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Criar produto' }));

    await waitFor(() =>
      expect(adminService.createProduct).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ description: longText.trim() }),
      ),
    );
  });

  it('bloqueia descrição acima de 2000 caracteres sem chamar a API', async () => {
    adminService.listProducts.mockResolvedValue({ content: [], totalPages: 0 });
    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    await screen.findByText('Nenhum produto');

    fireEvent.click(screen.getByRole('button', { name: 'Novo produto' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Vestido Longo' } });
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'a'.repeat(2001) } });
    fireEvent.change(screen.getByLabelText('Preço (R$)'), { target: { value: '199,90' } });
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar produto' }));

    expect(await screen.findByText('Máximo de 2000 caracteres')).toBeInTheDocument();
    expect(adminService.createProduct).not.toHaveBeenCalled();
  });

  it('mostra a mensagem de validação do backend (400 por campo)', async () => {
    adminService.listProducts.mockResolvedValue({ content: [], totalPages: 0 });
    adminService.createProduct.mockRejectedValue({
      response: { data: { description: 'A descrição deve ter no máximo 2000 caracteres' } },
    });
    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    await screen.findByText('Nenhum produto');

    fireEvent.click(screen.getByRole('button', { name: 'Novo produto' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Vestido Longo' } });
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Vestido longo' } });
    fireEvent.change(screen.getByLabelText('Preço (R$)'), { target: { value: '199,90' } });
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar produto' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A descrição deve ter no máximo 2000 caracteres',
    );
  });

  it('mostra o erro do servidor junto ao botão de criar', async () => {
    adminService.listProducts.mockResolvedValue({ content: [], totalPages: 0 });
    adminService.createProduct.mockRejectedValue({
      response: { data: { message: 'Product already exist!!' } },
    });

    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    await screen.findByText('Nenhum produto');

    fireEvent.click(screen.getByRole('button', { name: 'Novo produto' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Blusa Linho' } });
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Blusa de linho' } });
    fireEvent.change(screen.getByLabelText('Preço (R$)'), { target: { value: '89,90' } });
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar produto' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Já existe um produto com esse nome nesta categoria.',
    );
  });

  it('cria o produto e a grade de tamanhos de forma integrada', async () => {
    adminService.listProducts.mockResolvedValue({ content: [], totalPages: 0 });
    adminService.createProduct.mockResolvedValue({ productId: 42 });
    adminService.createVariants.mockResolvedValue([{ variantId: 1, size: 'P', stock: 3 }]);

    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    await screen.findByText('Nenhum produto');

    fireEvent.click(screen.getByRole('button', { name: 'Novo produto' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Vestido Midi' } });
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Vestido midi' } });
    fireEvent.change(screen.getByLabelText('Preço (R$)'), { target: { value: '199.9' } });
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '7' } });

    fireEvent.click(screen.getByLabelText('Tamanho P'));
    fireEvent.change(screen.getByLabelText('Estoque inicial P'), { target: { value: '3' } });
    fireEvent.click(screen.getByLabelText('Tamanho M'));

    fireEvent.click(screen.getByRole('button', { name: 'Criar produto' }));

    await waitFor(() => expect(adminService.createProduct).toHaveBeenCalled());
    await waitFor(() =>
      expect(adminService.createVariants).toHaveBeenCalledWith(42, [
        { size: 'P', initialStock: 3 },
        { size: 'M', initialStock: 0 },
      ]),
    );
  });

  it('cria um jeans com numeracao', async () => {
    adminService.listProducts.mockResolvedValue({ content: [], totalPages: 0 });
    adminService.createProduct.mockResolvedValue({ productId: 43 });
    adminService.createVariants.mockResolvedValue([]);
    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    await screen.findByText('Nenhum produto');

    fireEvent.click(screen.getByRole('button', { name: 'Novo produto' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Calça Jeans Reta' } });
    fireEvent.change(screen.getByLabelText('Descrição'), {
      target: { value: 'Jeans de cintura alta' },
    });
    fireEvent.change(screen.getByLabelText('Preço (R$)'), { target: { value: '189,90' } });
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '7' } });
    fireEvent.click(screen.getByLabelText('Tamanho 40'));
    fireEvent.click(screen.getByLabelText('Tamanho 38'));
    fireEvent.change(screen.getByLabelText('Estoque inicial 38'), { target: { value: '2' } });
    expect(screen.getByLabelText('Tamanho Único')).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Criar produto' }));

    await waitFor(() =>
      expect(adminService.createVariants).toHaveBeenCalledWith(43, [
        { size: '38', initialStock: 2 },
        { size: '40', initialStock: 0 },
      ]),
    );
  });

  it('desabilita "Único" quando ha tamanhos numerados marcados', async () => {
    adminService.listProducts.mockResolvedValue({ content: [], totalPages: 0 });
    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    await screen.findByText('Nenhum produto');

    fireEvent.click(screen.getByRole('button', { name: 'Novo produto' }));
    fireEvent.click(screen.getByLabelText('Tamanho P'));
    expect(screen.getByLabelText('Tamanho Único')).toBeDisabled();
  });
  it('busca produtos pelo nome e volta para a primeira página', async () => {
    adminService.listProducts.mockResolvedValue(PAGE);
    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    await screen.findByText('Vestido Midi');
    expect(adminService.listProducts).toHaveBeenLastCalledWith({
      pageNumber: 0,
      keyword: undefined,
    });

    adminService.listProducts.mockResolvedValue({ content: [], totalPages: 0, totalElements: 0 });
    fireEvent.change(screen.getByLabelText('Buscar produto'), { target: { value: '  saia ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() =>
      expect(adminService.listProducts).toHaveBeenLastCalledWith({
        pageNumber: 0,
        keyword: 'saia',
      }),
    );
    expect(await screen.findByText('Nenhum produto encontrado')).toBeInTheDocument();

    adminService.listProducts.mockResolvedValue(PAGE);
    fireEvent.click(screen.getByRole('button', { name: 'Limpar' }));
    expect(await screen.findByText('Vestido Midi')).toBeInTheDocument();
    expect(adminService.listProducts).toHaveBeenLastCalledWith({
      pageNumber: 0,
      keyword: undefined,
    });
  });

  it('continua editando (não cria) se a lista mudar com o formulário aberto', async () => {
    adminService.listProducts.mockResolvedValue(PAGE);
    adminService.updateProduct.mockResolvedValue({});
    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    await screen.findByText('Vestido Midi');

    fireEvent.click(screen.getByRole('button', { name: 'Editar Vestido Midi' }));
    // Busca que não traz o produto em edição.
    adminService.listProducts.mockResolvedValue({ content: [], totalPages: 0, totalElements: 0 });
    fireEvent.change(screen.getByLabelText('Buscar produto'), { target: { value: 'blusa' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await screen.findByText('Nenhum produto encontrado');

    fireEvent.change(screen.getByLabelText('Descrição'), {
      target: { value: 'Descrição nova do vestido' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() =>
      expect(adminService.updateProduct).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ productId: 1, description: 'Descrição nova do vestido' }),
      ),
    );
    expect(adminService.createProduct).not.toHaveBeenCalled();
  });

  it('trocar de produto em edição carrega os dados do novo produto', async () => {
    adminService.listProducts.mockResolvedValue({
      content: [
        { ...PAGE.content[0], description: 'Descrição do vestido' },
        {
          productId: 2,
          productName: 'Saia Longa',
          description: 'Descrição da saia',
          image: 'b.jpg',
          price: 150,
          specialPrice: 150,
          stock: 3,
        },
      ],
      totalPages: 1,
    });
    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
    await screen.findByText('Saia Longa');

    fireEvent.click(screen.getByRole('button', { name: 'Editar Vestido Midi' }));
    expect(screen.getByLabelText('Nome')).toHaveValue('Vestido Midi');

    fireEvent.click(screen.getByRole('button', { name: 'Editar Saia Longa' }));
    expect(screen.getByLabelText('Nome')).toHaveValue('Saia Longa');
    expect(screen.getByLabelText('Descrição')).toHaveValue('Descrição da saia');
  });
});
