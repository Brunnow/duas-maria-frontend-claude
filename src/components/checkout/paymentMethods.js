/*
 * Formas de pagamento (simuladas — nenhuma cobranca real nesta fase).
 * `value` e a string enviada ao backend em
 * POST /api/order/users/payments/{paymentMethod}.
 * O backend valida Payment.paymentMethod com @Size(min = 4), entao
 * todos os codigos aqui tem 4+ caracteres.
 */
export const PAYMENT_METHODS = [
  { value: 'pix-qr', label: 'PIX', hint: 'Aprovação imediata' },
  { value: 'credit-card', label: 'Cartão de crédito', hint: 'Em até 12x' },
  { value: 'boleto', label: 'Boleto bancário', hint: 'Vence em 3 dias úteis' },
  { value: 'on-delivery', label: 'Pagamento na entrega', hint: 'Pague ao receber' },
];
