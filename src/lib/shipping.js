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
