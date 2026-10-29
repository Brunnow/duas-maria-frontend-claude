import { money } from '@/lib/pixel';

/*
 * Carrinho de visitante (sem login), guardado só neste navegador. É uma
 * vitrine do que a cliente escolheu: preço e estoque daqui são os do momento
 * em que a peça entrou e servem só para mostrar. Ao entrar na conta, os itens
 * vão para o carrinho do servidor (cartSlice.mergeGuestCart), que valida
 * estoque e preço de verdade — a regra continua no backend.
 *
 * Item guardado: { productId, variantId, quantity, unitPrice, productName,
 *                  image, color, size, stock }
 */
const STORAGE_KEY = 'dm-guest-cart';

export function readGuestCart() {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    return Array.isArray(value)
      ? value.filter((item) => item?.variantId != null && Number(item.quantity) > 0)
      : [];
  } catch {
    return [];
  }
}

export function writeGuestCart(items) {
  try {
    if (items.length) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sem armazenamento (aba anônima bloqueada): o carrinho vale só até o F5.
  }
}

export function clearGuestCart() {
  writeGuestCart([]);
}

/** Mesmo formato do CartDTO do backend, para o drawer e a página não saberem a diferença. */
export function guestCartView(items) {
  const lines = items.map((item) => ({
    cartItemId: `guest-${item.variantId}`,
    productId: item.productId,
    variantId: item.variantId,
    productName: item.productName,
    size: item.size,
    color: item.color || '',
    image: item.image,
    unitPrice: money(item.unitPrice),
    quantity: item.quantity,
    lineTotal: money(money(item.unitPrice) * item.quantity),
  }));
  return {
    cartId: null,
    items: lines,
    totalPrice: money(lines.reduce((sum, line) => sum + line.lineTotal, 0)),
  };
}

/** Mensagem quando a quantidade passa do estoque visto na página. */
export function guestStockMessage(item) {
  const name =
    item.size && item.size !== 'Único' ? `${item.productName} (${item.size})` : item.productName;
  return item.stock === 1
    ? `${name}: só temos 1 unidade.`
    : `${name}: só temos ${item.stock} unidades.`;
}
