import { useEffect, useRef } from 'react';
import { money, track } from '@/lib/pixel';

// Pixel: assinatura do carrinho que já teve InitiateCheckout nesta aba — F5,
// erro, nova tentativa ou volta do Mercado Pago não contam o checkout de novo.
const CHECKOUT_TRACKED_KEY = 'dm-pixel-checkout';

/** Muda só quando muda produto, tamanho ou quantidade de alguma linha. */
export function cartSignature(items) {
  return items
    .map((item) => `${item.productId}:${item.variantId}:${item.size}:${item.quantity}`)
    .sort()
    .join('|');
}

function readTrackedCheckout() {
  try {
    return window.sessionStorage.getItem(CHECKOUT_TRACKED_KEY);
  } catch {
    return null;
  }
}

function rememberTrackedCheckout(signature) {
  try {
    window.sessionStorage.setItem(CHECKOUT_TRACKED_KEY, signature);
  } catch {
    // Sem armazenamento: o ref ainda segura os re-renders desta tela.
  }
}

/**
 * Parâmetros do InitiateCheckout/AddPaymentInfo. Valor no mesmo critério do
 * Purchase: produtos com os cupons já descontados, sem o frete.
 */
export function pixelCartParams(items, coupons = []) {
  const subtotal = items.reduce((sum, item) => sum + money(item.lineTotal), 0);
  const couponDiscount = coupons.reduce((sum, c) => sum + money(c.discountAmount), 0);
  return {
    content_type: 'product',
    content_ids: [...new Set(items.map((item) => String(item.productId)))],
    value: money(Math.max(subtotal - couponDiscount, 0)),
    currency: 'BRL',
    num_items: items.reduce((sum, item) => sum + (item.quantity ?? 0), 0),
  };
}

/**
 * InitiateCheckout quando o checkout abre com o carrinho pronto — uma vez por
 * carrinho (ref para os re-renders, sessionStorage para F5/volta do Mercado
 * Pago). Carrinho mudou de verdade = novo checkout. Vale para quem está
 * logado e para quem compra sem cadastro.
 */
export function useInitiateCheckout(cartReady, items) {
  const trackedRef = useRef(null);
  useEffect(() => {
    if (!cartReady) return;
    const signature = cartSignature(items);
    if (trackedRef.current === signature) return;
    trackedRef.current = signature;
    if (readTrackedCheckout() === signature) return;
    rememberTrackedCheckout(signature);
    track('InitiateCheckout', pixelCartParams(items));
  }, [cartReady, items]);
}
