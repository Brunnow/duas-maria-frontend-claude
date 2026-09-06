/*
 * Tradução do status do pedido (enum do backend, ver OrderStatus.java)
 * para exibição em pt-BR, e o "tone" do Badge (@/components/ui/Badge)
 * usado para representá-lo visualmente.
 */
const LABELS = {
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  PAGO: 'Pago',
  SEPARANDO: 'Separando',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

const TONES = {
  AGUARDANDO_PAGAMENTO: 'warning',
  PAGO: 'success',
  SEPARANDO: 'neutral',
  ENVIADO: 'accent',
  ENTREGUE: 'success',
  CANCELADO: 'danger',
};

/* Ordem do ciclo de vida — usada nos filtros do admin. */
export const ORDER_STATUS_VALUES = [
  'AGUARDANDO_PAGAMENTO',
  'PAGO',
  'SEPARANDO',
  'ENVIADO',
  'ENTREGUE',
  'CANCELADO',
];

export function orderStatusLabel(status) {
  return LABELS[status] || status || 'Status desconhecido';
}

export function orderStatusTone(status) {
  return TONES[status] || 'neutral';
}
