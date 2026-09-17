/*
 * Rótulo de uma opção de frete: transportadora + serviço para as opções
 * reais do Melhor Envio ("Correios · PAC", Fase ME3), ou "Entrega padrão"
 * para o fallback fixo por UF (sem transportadora/serviço — carrierName vem
 * null do backend, tanto na cotação quanto no snapshot salvo no pedido).
 */
export function shippingOptionLabel(option) {
  if (!option) return 'Frete';
  if (!option.carrierName) return option.serviceName || 'Entrega padrão';
  return `${option.carrierName} · ${option.serviceName}`;
}

/*
 * Tradução do status bruto de rastreio devolvido pelo Melhor Envio (Fase
 * ME7-lite — POST /api/v2/me/orders/search) para pt-BR, e o "tone" do Badge
 * (@/components/ui/Badge). A etiqueta é comprada manualmente, fora do
 * sistema; esse status só existe depois que o admin cola o código de
 * rastreio e o backend consegue localizar o envio.
 */
const TRACKING_LABELS = {
  created: 'Etiqueta criada',
  pending: 'Aguardando postagem',
  released: 'Aguardando postagem',
  generated: 'Aguardando postagem',
  received: 'Aguardando postagem',
  posted: 'Postado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  undelivered: 'Não entregue',
  paused: 'Envio suspenso',
  suspended: 'Envio suspenso',
};

const TRACKING_TONES = {
  created: 'neutral',
  pending: 'neutral',
  released: 'neutral',
  generated: 'neutral',
  received: 'neutral',
  posted: 'accent',
  delivered: 'success',
  cancelled: 'danger',
  undelivered: 'danger',
  paused: 'warning',
  suspended: 'warning',
};

export function trackingStatusLabel(status) {
  return TRACKING_LABELS[status] || status || 'Sem rastreio';
}

export function trackingStatusTone(status) {
  return TRACKING_TONES[status] || 'neutral';
}

/*
 * Progresso da compra da etiqueta no Melhor Envio (Fase ME5/ME6) —
 * Order.shippingLabelStatus no backend. Sempre o último passo concluído com
 * sucesso (nunca o que falhou); um erro em paralelo vem em shippingLabelError.
 */
const LABEL_STATUS_LABELS = {
  CARRINHO: 'No carrinho do Melhor Envio',
  PAGO: 'Pago — gerando etiqueta',
  GERADA: 'Etiqueta gerada',
};

const LABEL_STATUS_TONES = {
  CARRINHO: 'neutral',
  PAGO: 'accent',
  GERADA: 'success',
};

export function shippingLabelStatusLabel(status) {
  return LABEL_STATUS_LABELS[status] || 'Frete ainda não comprado';
}

export function shippingLabelStatusTone(status) {
  return LABEL_STATUS_TONES[status] || 'neutral';
}
