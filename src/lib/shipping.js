/* Rótulo em pt-BR da modalidade de frete (enum do backend, ShippingMethod). */
const LABELS = {
  FIXED_UF: 'Entrega padrão',
};

export function shippingMethodLabel(method) {
  return LABELS[method] || method || 'Frete';
}
