import {
  FiCreditCard,
  FiGift,
  FiMessageCircle,
  FiPackage,
  FiRefreshCw,
  FiShield,
  FiStar,
  FiTruck,
} from 'react-icons/fi';
import { formatCurrency } from '@/lib/format';

/* Ícones da faixa de benefícios — as chaves espelham StoreHighlight.Icon no backend. */
export const HIGHLIGHT_ICONS = {
  CARD: { Icon: FiCreditCard, label: 'Cartão' },
  TRUCK: { Icon: FiTruck, label: 'Caminhão' },
  GIFT: { Icon: FiGift, label: 'Presente' },
  BOX: { Icon: FiPackage, label: 'Caixa' },
  EXCHANGE: { Icon: FiRefreshCw, label: 'Troca' },
  SHIELD: { Icon: FiShield, label: 'Segurança' },
  CHAT: { Icon: FiMessageCircle, label: 'Atendimento' },
  STAR: { Icon: FiStar, label: 'Estrela' },
};

/** Texto exibido de um item; o de frete grátis é montado a partir do mínimo configurado. */
export function highlightText(item, freeShippingMinAmount) {
  if (item.kind === 'FREE_SHIPPING') {
    return freeShippingMinAmount != null
      ? `Frete grátis acima de ${formatCurrency(freeShippingMinAmount)}`
      : null;
  }
  return item.text || null;
}
