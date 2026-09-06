import { cepDigits } from '@/lib/br';

/*
 * Consulta o ViaCEP (serviço público) para autopreencher o endereço.
 * NÃO usa o cliente `api` (que tem baseURL do backend + credenciais) — é
 * uma chamada a um serviço externo.
 *
 * O ViaCEP NUNCA é obrigatório para finalizar o pedido: qualquer falha
 * (CEP inexistente, rede, timeout) é sinalizada e o usuário segue
 * preenchendo à mão.
 */

export class CepError extends Error {
  constructor(kind, message) {
    super(message);
    this.name = 'CepError';
    this.kind = kind; // 'invalid' | 'notFound' | 'network'
  }
}

export async function lookupCep(rawCep) {
  const cep = cepDigits(rawCep);
  if (cep.length !== 8) {
    throw new CepError('invalid', 'CEP deve ter 8 dígitos.');
  }

  let response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch {
    throw new CepError('network', 'Não foi possível consultar o CEP agora.');
  }

  if (!response.ok) {
    throw new CepError('network', 'Não foi possível consultar o CEP agora.');
  }

  const data = await response.json().catch(() => ({}));
  if (data?.erro) {
    throw new CepError('notFound', 'CEP não encontrado.');
  }

  // Só aproveita o que veio como string não-vazia — não persiste lixo.
  const pick = (v) => (typeof v === 'string' && v.trim() ? v.trim() : '');
  return {
    street: pick(data.logradouro),
    neighborhood: pick(data.bairro),
    city: pick(data.localidade),
    state: pick(data.uf).toUpperCase(),
  };
}
