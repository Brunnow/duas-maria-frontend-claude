import { describe, expect, it } from 'vitest';
import {
  shippingLabelStatusLabel,
  shippingLabelStatusTone,
  shippingOptionLabel,
  trackingStatusLabel,
  trackingStatusTone,
} from './shipping';

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

describe('trackingStatusLabel', () => {
  it('traduz os status conhecidos do Melhor Envio', () => {
    expect(trackingStatusLabel('posted')).toBe('Postado');
    expect(trackingStatusLabel('delivered')).toBe('Entregue');
    expect(trackingStatusLabel('cancelled')).toBe('Cancelado');
    expect(trackingStatusLabel('undelivered')).toBe('Não entregue');
  });

  it('cai no proprio valor quando nao reconhece o status', () => {
    expect(trackingStatusLabel('algo-novo')).toBe('algo-novo');
  });

  it('cai em "Sem rastreio" quando nao ha status', () => {
    expect(trackingStatusLabel(null)).toBe('Sem rastreio');
  });
});

describe('trackingStatusTone', () => {
  it('usa success pra entregue e danger pra cancelado/nao entregue', () => {
    expect(trackingStatusTone('delivered')).toBe('success');
    expect(trackingStatusTone('cancelled')).toBe('danger');
    expect(trackingStatusTone('undelivered')).toBe('danger');
  });

  it('cai em neutral quando nao reconhece o status', () => {
    expect(trackingStatusTone('algo-novo')).toBe('neutral');
  });
});

describe('shippingLabelStatusLabel', () => {
  it('traduz os 3 passos da compra da etiqueta (Fase ME5/ME6)', () => {
    expect(shippingLabelStatusLabel('CARRINHO')).toBe('No carrinho do Melhor Envio');
    expect(shippingLabelStatusLabel('PAGO')).toBe('Pago — gerando etiqueta');
    expect(shippingLabelStatusLabel('GERADA')).toBe('Etiqueta gerada');
  });

  it('cai em "Frete ainda não comprado" quando nao ha status (compra nunca iniciada)', () => {
    expect(shippingLabelStatusLabel(null)).toBe('Frete ainda não comprado');
  });
});

describe('shippingLabelStatusTone', () => {
  it('usa success so pra etiqueta gerada', () => {
    expect(shippingLabelStatusTone('GERADA')).toBe('success');
    expect(shippingLabelStatusTone('CARRINHO')).toBe('neutral');
    expect(shippingLabelStatusTone('PAGO')).toBe('accent');
  });

  it('cai em neutral quando nao ha status', () => {
    expect(shippingLabelStatusTone(null)).toBe('neutral');
  });
});
