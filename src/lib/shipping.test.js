import { describe, expect, it } from 'vitest';
import { shippingOptionLabel } from './shipping';

describe('shippingOptionLabel', () => {
  it('junta transportadora e servico quando ha os dois (Melhor Envio)', () => {
    expect(shippingOptionLabel({ carrierName: 'Correios', serviceName: 'PAC' })).toBe(
      'Correios · PAC',
    );
  });

  it('usa so o nome do servico quando nao ha transportadora (fallback fixo por UF)', () => {
    expect(shippingOptionLabel({ carrierName: null, serviceName: 'Entrega padrão' })).toBe(
      'Entrega padrão',
    );
  });

  it('cai em "Entrega padrão" quando nao ha transportadora nem servico (snapshot de pedido FIXED_UF)', () => {
    expect(shippingOptionLabel({ carrierName: null, serviceName: null })).toBe('Entrega padrão');
  });

  it('cai em "Frete" quando nao ha opcao nenhuma', () => {
    expect(shippingOptionLabel(null)).toBe('Frete');
  });
});
