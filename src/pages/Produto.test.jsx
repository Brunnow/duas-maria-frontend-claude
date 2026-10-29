import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { anonymousAuth, authenticatedAuth, makeStore } from '@/test/renderWithProviders';

vi.mock('@/services/productService', () => ({
  getProduct: vi.fn(),
  getProductVariants: vi.fn(),
}));
vi.mock('@/lib/pixel', async (importOriginal) => ({ ...(await importOriginal()), track: vi.fn() }));
vi.mock('@/services/cartService', () => ({
  getCart: vi.fn().mockResolvedValue({ cartId: 1, totalPrice: 0, items: [] }),
  addVariantToCart: vi.fn(),
  incrementVariant: vi.fn(),
  decrementVariant: vi.fn(),
  removeVariant: vi.fn(),
}));

import { getProduct, getProductVariants } from '@/services/productService';
import { addVariantToCart } from '@/services/cartService';
import { track } from '@/lib/pixel';
import Produto from './Produto';

const product = {
  productId: 7,
  productName: 'Blazer Alfaiataria',
  image: 'http://localhost:8080/images/blazer.jpg',
  description: 'Blazer de alfaiataria.',
  price: 459.9,
  specialPrice: 459.9,
  discount: 0,
  inStock: true,
  stock: 7,
};

const cartDto = {
  cartId: 1,
  totalPrice: 459.9,
  items: [
    {
      cartItemId: 1,
      productId: 7,
      variantId: 55,
      productName: 'Blazer Alfaiataria',
      size: 'Único',
      image: 'blazer.jpg',
      unitPrice: 459.9,
      quantity: 1,
      lineTotal: 459.9,
    },
  ],
};

function renderAt(id, { auth = authenticatedAuth, query = '' } = {}) {
  const store = makeStore(auth);
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/produtos/${id}${query}`]}>
        <Routes>
          <Route path="/produtos/:id" element={<Produto />} />
          <Route path="/login" element={<div>Tela de login</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('Produto (PDP)', () => {
  it('renderiza o produto e o seletor de tamanho, com tamanho sem estoque desabilitado', async () => {
    getProduct.mockResolvedValue(product);
    getProductVariants.mockResolvedValue([
      { variantId: 1, size: 'P', stock: 2, inStock: true },
      { variantId: 2, size: 'M', stock: 0, inStock: false },
    ]);

    renderAt(7);

    expect(await screen.findByRole('heading', { name: 'Blazer Alfaiataria' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'P' })).toBeEnabled();
    expect(screen.getByRole('radio', { name: 'M' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /selecione um tamanho/i })).toBeDisabled();
  });

  it('publica os dados do produto para o Google sem inventar marca', async () => {
    getProduct.mockResolvedValue(product);
    getProductVariants.mockResolvedValue([{ variantId: 1, size: 'P', stock: 0, inStock: false }]);
    renderAt(7);

    await screen.findByRole('heading', { name: 'Blazer Alfaiataria' });
    await waitFor(() => expect(document.getElementById('seo-jsonld')).not.toBeNull());
    const data = JSON.parse(document.getElementById('seo-jsonld').textContent);
    expect(document.title).toBe('Blazer Alfaiataria | Duas Maria');
    expect(data.brand).toBeUndefined();
    expect(data.offers.seller.name).toBe('Duas Maria');
    expect(data.offers.availability).toBe('https://schema.org/OutOfStock');
    expect(data.offers.hasMerchantReturnPolicy.merchantReturnDays).toBe(7);
  });

  it('mostra o aviso de troca: peca normal tem troca, peca em promocao nao', async () => {
    getProduct.mockResolvedValue(product);
    getProductVariants.mockResolvedValue([{ variantId: 1, size: 'P', stock: 2, inStock: true }]);
    renderAt(7);

    expect(await screen.findByText(/Primeira troca grátis em até 7 dias/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Trocas e devoluções' })).toHaveAttribute(
      'href',
      '/trocas-e-devolucoes',
    );
  });

  it('peca em promocao avisa que nao tem troca', async () => {
    getProduct.mockResolvedValue({ ...product, specialPrice: 299.9 });
    getProductVariants.mockResolvedValue([{ variantId: 1, size: 'P', stock: 2, inStock: true }]);
    renderAt(7);

    expect(await screen.findByText(/Peça em promoção: não tem troca/)).toBeInTheDocument();
    expect(screen.queryByText(/Primeira troca grátis/)).not.toBeInTheDocument();
  });

  it('mostra "produto nao encontrado" no 404', async () => {
    getProduct.mockRejectedValue({ response: { status: 404, data: { message: 'x' } } });
    getProductVariants.mockRejectedValue({ response: { status: 404 } });

    renderAt(999);

    expect(await screen.findByText('Produto não encontrado')).toBeInTheDocument();
  });

  it('logado: adiciona ao carrinho pelo variantId e abre o CartDrawer', async () => {
    getProduct.mockResolvedValue(product);
    getProductVariants.mockResolvedValue([
      { variantId: 55, size: 'Único', stock: 5, inStock: true },
    ]);
    addVariantToCart.mockResolvedValue(cartDto);

    const store = renderAt(7);

    const addButton = await screen.findByRole('button', { name: 'Adicionar ao carrinho' });
    addButton.click();

    await waitFor(() => expect(addVariantToCart).toHaveBeenCalledWith(7, 55, 1));
    await waitFor(() => expect(store.getState().cart.drawerOpen).toBe(true));
  });

  it('logado: variante ja no carrinho (400) avisa e abre o CartDrawer', async () => {
    getProduct.mockResolvedValue(product);
    getProductVariants.mockResolvedValue([
      { variantId: 55, size: 'Único', stock: 5, inStock: true },
    ]);
    addVariantToCart.mockRejectedValue({
      response: { status: 400, data: { message: 'A variação BLAZER-UNICO já está no carrinho.' } },
    });

    const store = renderAt(7);

    (await screen.findByRole('button', { name: 'Adicionar ao carrinho' })).click();

    await waitFor(() => expect(store.getState().cart.drawerOpen).toBe(true));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Esse tamanho já está no seu carrinho',
    );
  });

  it('logado: estoque insuficiente (400) mostra a mensagem do backend', async () => {
    getProduct.mockResolvedValue(product);
    getProductVariants.mockResolvedValue([
      { variantId: 55, size: 'Único', stock: 5, inStock: true },
    ]);
    addVariantToCart.mockRejectedValue({
      response: { status: 400, data: { message: 'Blazer Alfaiataria (Único) está esgotado.' } },
    });

    const store = renderAt(7);

    (await screen.findByRole('button', { name: 'Adicionar ao carrinho' })).click();

    expect(
      await screen.findByText('Blazer Alfaiataria (Único) está esgotado.'),
    ).toBeInTheDocument();
    expect(store.getState().cart.drawerOpen).toBe(false);
  });

  it('deslogado: adiciona no carrinho do visitante, sem login e sem chamar a API', async () => {
    getProduct.mockResolvedValue(product);
    getProductVariants.mockResolvedValue([
      { variantId: 55, size: 'Único', stock: 5, inStock: true },
    ]);

    const store = renderAt(7, { auth: anonymousAuth });

    (await screen.findByRole('button', { name: 'Adicionar ao carrinho' })).click();

    await waitFor(() => expect(store.getState().cart.drawerOpen).toBe(true));
    expect(screen.queryByText('Tela de login')).toBeNull();
    expect(addVariantToCart).not.toHaveBeenCalled();
    expect(store.getState().cart.items).toEqual([
      expect.objectContaining({
        productId: 7,
        variantId: 55,
        productName: 'Blazer Alfaiataria',
        size: 'Único',
        unitPrice: 459.9,
        quantity: 1,
      }),
    ]);
    expect(JSON.parse(window.localStorage.getItem('dm-guest-cart'))).toHaveLength(1);
  });

  it('logado: 401 do carrinho (sessao caiu) guarda a peca como visitante, sem ir ao login', async () => {
    getProduct.mockResolvedValue(product);
    getProductVariants.mockResolvedValue([
      { variantId: 55, size: 'Único', stock: 5, inStock: true },
    ]);
    addVariantToCart.mockRejectedValue({ response: { status: 401 } });

    const store = renderAt(7);

    (await screen.findByRole('button', { name: 'Adicionar ao carrinho' })).click();

    await waitFor(() => expect(store.getState().cart.drawerOpen).toBe(true));
    expect(screen.queryByText('Tela de login')).toBeNull();
    expect(store.getState().cart.owner).toBe('guest');
  });

  describe('Pixel AddToCart', () => {
    const addToCartCalls = () => track.mock.calls.filter(([event]) => event === 'AddToCart');
    const expected = {
      content_type: 'product',
      content_ids: ['7'],
      content_name: 'Blazer Alfaiataria',
      value: 459.9,
      currency: 'BRL',
      contents: [{ id: '7', quantity: 1 }],
    };

    it.each([
      ['visitante', anonymousAuth],
      ['logado', authenticatedAuth],
    ])('%s: dispara uma vez, com os mesmos parametros', async (_, auth) => {
      getProduct.mockResolvedValue(product);
      getProductVariants.mockResolvedValue([
        { variantId: 55, size: 'Único', stock: 5, inStock: true },
      ]);
      addVariantToCart.mockResolvedValue(cartDto);

      const store = renderAt(7, { auth });
      (await screen.findByRole('button', { name: 'Adicionar ao carrinho' })).click();

      await waitFor(() => expect(store.getState().cart.drawerOpen).toBe(true));
      expect(addToCartCalls()).toEqual([['AddToCart', expected]]);
    });

    it('nao dispara quando a peca nao entra (ja estava no carrinho do visitante)', async () => {
      getProduct.mockResolvedValue(product);
      getProductVariants.mockResolvedValue([
        { variantId: 55, size: 'Único', stock: 5, inStock: true },
      ]);

      renderAt(7, { auth: anonymousAuth });
      const button = await screen.findByRole('button', { name: 'Adicionar ao carrinho' });
      button.click();
      await waitFor(() => expect(addToCartCalls()).toHaveLength(1));

      fireEvent.click(button);
      expect(await screen.findByText(/já está no seu carrinho/)).toBeInTheDocument();
      expect(addToCartCalls()).toHaveLength(1);
    });
  });

  describe('celular: barra fixa de compra', () => {
    const originalMatchMedia = window.matchMedia;
    beforeEach(() => {
      // Tela menor que 1024px: (min-width: 1024px) nao bate.
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));
    });
    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it('tamanho e botao ficam na barra do rodape (uma vez so na pagina)', async () => {
      getProduct.mockResolvedValue(product);
      getProductVariants.mockResolvedValue([
        { variantId: 55, size: 'P', stock: 5, inStock: true },
        { variantId: 56, size: 'M', stock: 0, inStock: false },
      ]);

      const store = renderAt(7, { auth: anonymousAuth });

      const bar = await screen.findByRole('region', { name: 'Comprar' });
      expect(bar).toHaveClass('fixed', 'bottom-0');
      expect(screen.getAllByRole('radiogroup', { name: 'Tamanho' })).toHaveLength(1);
      expect(within(bar).getByRole('radiogroup', { name: 'Tamanho' })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Selecione um tamanho' })).toHaveLength(1);

      fireEvent.click(within(bar).getByLabelText('P'));
      fireEvent.click(within(bar).getByRole('button', { name: 'Adicionar ao carrinho' }));

      await waitFor(() => expect(store.getState().cart.items).toHaveLength(1));
      expect(store.getState().cart.items[0]).toMatchObject({ variantId: 55, size: 'P' });
    });
  });

  describe('cores', () => {
    const colorProduct = {
      ...product,
      images: [
        { imageId: 1, url: 'http://x/verde.jpg', primary: true, color: 'Verde' },
        { imageId: 2, url: 'http://x/azul.jpg', primary: false, color: 'Azul' },
        { imageId: 3, url: 'http://x/etiqueta.jpg', primary: false, color: null },
      ],
      colors: [
        { name: 'Verde', hex: '#2E7D32', image: 'http://x/verde.jpg', inStock: false },
        { name: 'Azul', hex: null, image: 'http://x/azul.jpg', inStock: true },
      ],
    };
    const colorVariants = [
      { variantId: 1, size: 'P', stock: 0, inStock: false, color: 'Verde' },
      { variantId: 2, size: 'M', stock: 0, inStock: false, color: 'Verde' },
      { variantId: 3, size: 'G', stock: 2, inStock: true, color: 'Azul' },
    ];
    const sizes = () => screen.getAllByRole('radio').map((r) => r.closest('label').textContent);
    const galleryThumbs = () => screen.queryAllByRole('button', { name: /Ver imagem/ }).length;

    it('abre na primeira cor com estoque e mostra so os tamanhos e fotos dela', async () => {
      getProduct.mockResolvedValue(colorProduct);
      getProductVariants.mockResolvedValue(colorVariants);

      renderAt(7);

      expect(await screen.findByRole('button', { name: 'Cor Azul' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByRole('button', { name: 'Cor Verde (esgotada)' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
      expect(sizes()).toEqual(['G']);
      expect(galleryThumbs()).toBe(2); // foto azul + a que vale para todas
    });

    it('trocar de cor troca os tamanhos e avisa quando a cor esta esgotada', async () => {
      getProduct.mockResolvedValue(colorProduct);
      getProductVariants.mockResolvedValue(colorVariants);

      renderAt(7);
      fireEvent.click(await screen.findByRole('button', { name: 'Cor Verde (esgotada)' }));

      expect(sizes()).toEqual(['P', 'M']);
      expect(screen.getByText('Verde esgotada. Veja as outras cores.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Selecione um tamanho' })).toBeDisabled();
    });

    it('respeita a cor da URL (?cor=) e adiciona a variacao certa', async () => {
      getProduct.mockResolvedValue({
        ...colorProduct,
        colors: colorProduct.colors.map((c) => ({ ...c, inStock: true })),
      });
      getProductVariants.mockResolvedValue([
        { variantId: 1, size: 'P', stock: 1, inStock: true, color: 'Verde' },
        { variantId: 3, size: 'P', stock: 2, inStock: true, color: 'Azul' },
      ]);
      addVariantToCart.mockResolvedValue({ cartId: 1, totalPrice: 0, items: [] });

      renderAt(7, { query: '?cor=verde' });

      expect(await screen.findByRole('button', { name: 'Cor Verde' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      fireEvent.click(screen.getByRole('radio', { name: 'P' }));
      fireEvent.click(screen.getByRole('button', { name: 'Adicionar ao carrinho' }));

      await waitFor(() => expect(addVariantToCart).toHaveBeenCalled());
      expect(addVariantToCart.mock.calls[0][1]).toBe(1); // variação Verde P, não a Azul P
    });

    it('produto sem cor nao mostra o seletor de cor', async () => {
      getProduct.mockResolvedValue(product);
      getProductVariants.mockResolvedValue([{ variantId: 1, size: 'P', stock: 2, inStock: true }]);

      renderAt(7);

      await screen.findByRole('heading', { name: 'Blazer Alfaiataria' });
      expect(screen.queryByText(/^Cor:/)).not.toBeInTheDocument();
    });
  });
});
