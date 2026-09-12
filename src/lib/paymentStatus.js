/*
 * Tradução do status do pagamento (enum do backend, ver PaymentStatus.java)
 * para exibição em pt-BR, e o "tone" do Badge (@/components/ui/Badge)
 * usado para representá-lo visualmente.
 */
const LABELS = {
  PENDING: 'Pendente',
  IN_PROCESS: 'Em análise',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
  CANCELLED: 'Cancelado',
  REFUND_PENDING: 'Estorno pendente',
  REFUNDED: 'Estornado',
  CHARGED_BACK: 'Chargeback',
};

const TONES = {
  PENDING: 'warning',
  IN_PROCESS: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
  REFUND_PENDING: 'warning',
  REFUNDED: 'accent',
  CHARGED_BACK: 'danger',
};

export function paymentStatusLabel(status) {
  return LABELS[status] || status || 'Sem pagamento';
}

export function paymentStatusTone(status) {
  return TONES[status] || 'neutral';
}
