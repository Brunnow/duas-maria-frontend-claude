import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
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
  uploadProductImages: vi.fn(),
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

  describe('criação numa tela só (tamanhos, cores e fotos)', () => {
    const photo = (name) => new File(['x'], name, { type: 'image/jpeg' });

    async function openNewProduct() {
      adminService.listProducts.mockResolvedValue({ content: [], totalPages: 0 });
      adminService.createProduct.mockResolvedValue({ productId: 42 });
      adminService.createVariants.mockResolvedValue([]);
      adminService.uploadProductImages.mockResolvedValue([]);
      renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });
      await screen.findByText('Nenhum produto');
      fireEvent.click(screen.getByRole('button', { name: 'Novo produto' }));
      fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Vestido Midi' } });
      fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Vestido midi' } });
      fireEvent.change(screen.getByLabelText('Preço (R$)'), { target: { value: '199.9' } });
      fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '7' } });
    }

    const pick = (container, label, files) =>
      fireEvent.change(within(container).getByLabelText(label), { target: { files } });

    it('sem cores: cria os tamanhos e envia as fotos escolhidas, uma por vez', async () => {
      await openNewProduct();
      fireEvent.click(screen.getByLabelText('Tamanho P'));
      pick(document.body, 'Fotos', [photo('a.jpg'), photo('b.jpg')]);
      fireEvent.click(screen.getByRole('button', { name: 'Criar produto' }));

      await waitFor(() => expect(adminService.uploadProductImages).toHaveBeenCalledTimes(2));
      expect(adminService.createVariants).toHaveBeenCalledWith(42, [
        { size: 'P', initialStock: 0 },
      ]);
      expect(adminService.uploadProductImages.mock.calls[0][1][0].name).toBe('a.jpg');
      expect(adminService.uploadProductImages.mock.calls[0]).toHaveLength(2); // sem cor
      expect(await screen.findByText('Produto criado e 2 fotos enviadas.')).toBeInTheDocument();
    });

    it('com cores: cria cada cor com seus tamanhos e as fotos já na cor certa', async () => {
      await openNewProduct();
      fireEvent.click(screen.getByLabelText('Com cores'));
      const cor1 = screen.getByRole('region', { name: 'Cor 1' });
      fireEvent.change(within(cor1).getByLabelText('Nome da cor'), { target: { value: 'Verde' } });
      fireEvent.click(within(cor1).getByLabelText('Bolinha de cor'));
      fireEvent.click(within(cor1).getByLabelText('Tamanho P'));
      fireEvent.change(within(cor1).getByLabelText('Estoque inicial P'), {
        target: { value: '2' },
      });
      pick(cor1, 'Fotos desta cor', [photo('verde.jpg')]);

      fireEvent.click(screen.getByRole('button', { name: '+ Adicionar outra cor' }));
      const cor2 = screen.getByRole('region', { name: 'Cor 2' });
      fireEvent.change(within(cor2).getByLabelText('Nome da cor'), {
        target: { value: 'Floral azul' },
      });
      fireEvent.click(within(cor2).getByLabelText('Tamanho M'));
      pick(cor2, 'Fotos desta cor', [photo('floral1.jpg'), photo('floral2.jpg')]);

      fireEvent.click(screen.getByRole('button', { name: 'Criar produto' }));

      await waitFor(() => expect(adminService.uploadProductImages).toHaveBeenCalledTimes(3));
      expect(adminService.createVariants.mock.calls).toEqual([
        [42, [{ size: 'P', initialStock: 2 }], { color: 'Verde', colorHex: '#1F1F1F' }],
        [42, [{ size: 'M', initialStock: 0 }], { color: 'Floral azul', colorHex: null }],
      ]);
      expect(adminService.uploadProductImages.mock.calls.map((c) => [c[1][0].name, c[2]])).toEqual([
        ['verde.jpg', 'Verde'],
        ['floral1.jpg', 'Floral azul'],
        ['floral2.jpg', 'Floral azul'],
      ]);
      // a cor só é criada antes das fotos dela (o backend recusa foto de cor inexistente)
      expect(adminService.createVariants.mock.invocationCallOrder[1]).toBeLessThan(
        adminService.uploadProductImages.mock.invocationCallOrder[1],
      );
      expect(
        await screen.findByText('Produto criado com 2 cores e 3 fotos enviadas.'),
      ).toBeInTheDocument();
    });

    it('cor sem nome, repetida ou sem tamanho não chama a API', async () => {
      await openNewProduct();
      fireEvent.click(screen.getByLabelText('Com cores'));
      fireEvent.click(screen.getByRole('button', { name: '+ Adicionar outra cor' }));
      const cor1 = screen.getByRole('region', { name: 'Cor 1' });
      const cor2 = screen.getByRole('region', { name: 'Cor 2' });
      fireEvent.change(within(cor1).getByLabelText('Nome da cor'), { target: { value: 'Verde' } });
      fireEvent.click(within(cor1).getByLabelText('Tamanho P'));
      fireEvent.change(within(cor2).getByLabelText('Nome da cor'), { target: { value: 'verde' } });

      fireEvent.click(screen.getByRole('button', { name: 'Criar produto' }));

      expect(await within(cor2).findByText('Essa cor já está acima')).toBeInTheDocument();
      expect(within(cor2).getByText('Marque ao menos um tamanho desta cor.')).toBeInTheDocument();
      expect(adminService.createProduct).not.toHaveBeenCalled();
    });

    it('remover uma cor antes de salvar tira ela do envio', async () => {
      await openNewProduct();
      fireEvent.click(screen.getByLabelText('Com cores'));
      fireEvent.click(screen.getByRole('button', { name: '+ Adicionar outra cor' }));
      const cor1 = screen.getByRole('region', { name: 'Cor 1' });
      fireEvent.change(within(cor1).getByLabelText('Nome da cor'), { target: { value: 'Verde' } });
      fireEvent.click(within(cor1).getByLabelText('Tamanho P'));
      fireEvent.click(screen.getByRole('button', { name: 'Remover a cor 2' }));

      fireEvent.click(screen.getByRole('button', { name: 'Criar produto' }));

      await waitFor(() => expect(adminService.createVariants).toHaveBeenCalledTimes(1));
      expect(adminService.createVariants.mock.calls[0][2]).toEqual({
        color: 'Verde',
        colorHex: null,
      });
    });

    it('se uma cor falhar, segue com as outras, não envia as fotos dela e abre o painel de cores', async () => {
      await openNewProduct();
      adminService.createVariants
        .mockRejectedValueOnce({ response: { data: { message: 'Tamanho inválido' } } })
        .mockResolvedValueOnce([]);
      fireEvent.click(screen.getByLabelText('Com cores'));
      fireEvent.click(screen.getByRole('button', { name: '+ Adicionar outra cor' }));
      const cor1 = screen.getByRole('region', { name: 'Cor 1' });
      const cor2 = screen.getByRole('region', { name: 'Cor 2' });
      fireEvent.change(within(cor1).getByLabelText('Nome da cor'), { target: { value: 'Verde' } });
      fireEvent.click(within(cor1).getByLabelText('Tamanho P'));
      pick(cor1, 'Fotos desta cor', [photo('verde.jpg')]);
      fireEvent.change(within(cor2).getByLabelText('Nome da cor'), { target: { value: 'Azul' } });
      fireEvent.click(within(cor2).getByLabelText('Tamanho M'));
      pick(cor2, 'Fotos desta cor', [photo('azul.jpg')]);

      fireEvent.click(screen.getByRole('button', { name: 'Criar produto' }));

      expect(
        await screen.findByText(/Produto criado, mas faltou: cor Verde \(Tamanho inválido\)/),
      ).toBeInTheDocument();
      expect(adminService.uploadProductImages).toHaveBeenCalledTimes(1);
      expect(adminService.uploadProductImages.mock.calls[0][2]).toBe('Azul');
      // painel de cores/tamanhos do produto novo aberto para concluir
      expect(
        await screen.findByRole('heading', { name: /tamanhos e estoque/i }),
      ).toBeInTheDocument();
    });

    it('passar para "com cores" leva os tamanhos e as fotos já marcados para a primeira cor', async () => {
      await openNewProduct();
      fireEvent.click(screen.getByLabelText('Tamanho G'));
      pick(document.body, 'Fotos', [photo('a.jpg')]);
      fireEvent.click(screen.getByLabelText('Com cores'));

      const cor1 = screen.getByRole('region', { name: 'Cor 1' });
      expect(within(cor1).getByLabelText('Tamanho G')).toBeChecked();
      expect(
        within(cor1).getByText('1/8 · até 5 MB cada · sobem ao criar o produto'),
      ).toBeInTheDocument();
    });

    it('recusa foto acima de 5 MB antes de enviar', async () => {
      await openNewProduct();
      const big = new File(['x'], 'grande.jpg', { type: 'image/jpeg' });
      Object.defineProperty(big, 'size', { value: 6 * 1024 * 1024 });
      pick(document.body, 'Fotos', [big]);

      expect(await screen.findByText('grande.jpg: acima de 5 MB.')).toBeInTheDocument();
      expect(
        screen.getByText('0/8 · até 5 MB cada · sobem ao criar o produto'),
      ).toBeInTheDocument();
    });
  });

  it('o lapis abre a edicao numa tela so: dados, cores/tamanhos e fotos', async () => {
    adminService.listProducts.mockResolvedValue(PAGE);
    adminService.getVariants.mockResolvedValue([
      { variantId: 1, productId: 1, size: 'M', sku: 'X', stock: 2, color: 'Verde', colorHex: null },
    ]);
    adminService.listProductImages.mockResolvedValue([]);
    renderWithProviders(<AdminProdutos />, { preloadedState: preloaded });

    fireEvent.click(await screen.findByRole('button', { name: 'Editar Vestido Midi' }));

    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument();
    expect(await screen.findByRole('region', { name: 'Cor Verde' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Imagens do produto' })).toBeInTheDocument();
    expect(screen.getByText(/salvos na hora/)).toBeInTheDocument();
  });
});
