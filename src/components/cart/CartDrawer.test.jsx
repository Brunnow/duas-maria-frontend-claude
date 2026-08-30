import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { anonymousAuth, cartState, renderWithProviders } from '@/test/renderWithProviders';
import CartDrawer from './CartDrawer';

vi.mock('@/services/cartService', () => ({
  getCart: vi.fn().mockResolvedValue({ cartId: 1, totalPrice: 0, items: [] }),
  addVariantToCart: vi.fn(),
  incrementVariant: vi.fn().mockResolvedValue({ cartId: 1, totalPrice: 150, items: [] }),
  decrementVariant: vi.fn().mockResolvedValue({ cartId: 1, totalPrice: 50, items: [] }),
  removeVariant: vi.fn().mockResolvedValue('removido'),
}));

import * as cartService from '@/services/cartService';

const item = {
  cartItemId: 9,
  productId: 2,
  variantId: 7,
  productName: 'Vestido Midi',
  size: 'M',
  image: 'http://x/a.jpg',
  unitPrice: 50,
  quantity: 2,
  lineTotal: 100,
};

const openWith = (items) => ({ ...anonymousAuth, ...cartState(items, { drawerOpen: true }) });

describe('CartDrawer', () => {
  it('mostra o estado vazio quando nao ha itens', () => {
    renderWithProviders(<CartDrawer />, { preloadedState: openWith([]) });
    expect(screen.getByText('Seu carrinho está vazio.')).toBeInTheDocument();
  });

  it('lista o item com tamanho e o botao de finalizar', () => {
    renderWithProviders(<CartDrawer />, { preloadedState: openWith([item]) });
    expect(screen.getByText('Vestido Midi')).toBeInTheDocument();
    expect(screen.getByText('Tamanho: M')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Finalizar compra' })).toHaveAttribute(
      'href',
      '/checkout',
    );
  });

  it('aumentar quantidade chama o backend com o variantId', async () => {
    renderWithProviders(<CartDrawer />, { preloadedState: openWith([item]) });
    screen.getByRole('button', { name: 'Aumentar quantidade' }).click();
    await waitFor(() => expect(cartService.incrementVariant).toHaveBeenCalledWith(7));
  });

  it('remover item chama DELETE com cartId e variantId', async () => {
    renderWithProviders(<CartDrawer />, { preloadedState: openWith([item]) });
    screen.getByRole('button', { name: /remover vestido midi/i }).click();
    await waitFor(() => expect(cartService.removeVariant).toHaveBeenCalledWith(1, 7));
  });
});
