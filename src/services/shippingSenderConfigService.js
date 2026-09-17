import api from '@/api/api';

/*
 * Painel administrativo — dados do remetente (a loja) exigidos pelo Melhor
 * Envio pra inserir um envio no carrinho (Fase ME5). Tabela de linha única
 * no backend: GET devolve null se ainda não foi preenchida nenhuma vez.
 *
 *   GET /api/admin/shipping/sender-config -> 200 ShippingSenderConfigDTO | null
 *   PUT /api/admin/shipping/sender-config { ... } -> 200 ShippingSenderConfigDTO | 400 validação
 */

export function getSenderConfig() {
  return api.get('/admin/shipping/sender-config').then((response) => response.data);
}

export function saveSenderConfig(config) {
  return api.put('/admin/shipping/sender-config', config).then((response) => response.data);
}
