import api from '@/api/api';

/*
 * Opções de frete (Fase ME3 — Melhor Envio + fallback fixo por UF),
 * ShippingController, exige auth:
 *   POST /api/shipping/options  { cep, uf }
 *     -> 200 ShippingOptionDTO[] { serviceId, carrierName, serviceName, price, deliveryDays }
 *     -> 400 { cep: "CEP inválido" } | { uf: "UF inválida" }
 *
 * A quantidade de peças vem do carrinho do próprio usuário no backend — o
 * frontend nunca manda quantidade. O `serviceId` escolhido aqui é só um
 * palpite: o backend recota tudo de novo na criação do pedido e falha se o
 * serviço escolhido não estiver mais entre as opções.
 */
export function getShippingOptions({ cep, uf }) {
  return api.post('/shipping/options', { cep, uf }).then((response) => response.data);
}
