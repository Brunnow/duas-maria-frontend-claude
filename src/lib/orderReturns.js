import { formatCurrency } from '@/lib/format';

/* Textos das trocas/devoluções (OrderReturnDTO do backend), usados no admin e em "Meus pedidos". */

export function returnTitle(ret) {
  return ret.type === 'TROCA' ? 'Troca' : 'Devolução';
}

/** "1x Vestido M → G" / "1x Blusa P". */
export function returnItemLine(item) {
  const to = item.newSize ? ` → ${item.newSize}` : '';
  return `${item.quantity}x ${item.productName} ${item.returnedSize ?? ''}${to}`.replace(/\s+/g, ' ').trim();
}

/** "Estorno de R$ 90,00" (+ "em processamento" quando o Mercado Pago ainda não confirmou). */
export function returnRefundText(ret) {
  if (ret.type !== 'DEVOLUCAO') return null;
  const value = `Estorno de ${formatCurrency(ret.refundAmount)}`;
  return ret.refundStatus === 'PENDING' ? `${value} · em processamento` : value;
}
