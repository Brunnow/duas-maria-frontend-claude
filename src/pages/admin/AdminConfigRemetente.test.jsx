import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { adminAuth, renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/services/shippingSenderConfigService', () => ({
  getSenderConfig: vi.fn(),
  saveSenderConfig: vi.fn(),
}));

import * as svc from '@/services/shippingSenderConfigService';
import AdminConfigRemetente from './AdminConfigRemetente';

const savedConfig = {
  name: 'Duas Marias',
  document: null,
  companyDocument: '12345678000199',
  stateRegister: 'ISENTO',
  address: 'Rua da Loja',
  number: '50',
  complement: null,
  district: 'Centro',
  city: 'Planaltina',
  stateAbbr: 'GO',
  postalCode: '73752018',
  phone: '61999999999',
  email: 'contato@duasmarias.com.br',
};

beforeEach(() => vi.clearAllMocks());

describe('AdminConfigRemetente', () => {
  it('mostra o formulario vazio quando ainda nao ha configuracao salva', async () => {
    svc.getSenderConfig.mockResolvedValue(null);
    renderWithProviders(<AdminConfigRemetente />, { preloadedState: adminAuth });

    expect(await screen.findByLabelText('Nome do remetente')).toHaveValue('');
    expect(screen.getByLabelText('CEP')).toHaveValue('');
  });

  it('preenche o formulario com os dados ja salvos, formatando CNPJ e CEP', async () => {
    svc.getSenderConfig.mockResolvedValue(savedConfig);
    renderWithProviders(<AdminConfigRemetente />, { preloadedState: adminAuth });

    expect(await screen.findByLabelText('Nome do remetente')).toHaveValue('Duas Marias');
    expect(screen.getByLabelText('CNPJ')).toHaveValue('12.345.678/0001-99');
    expect(screen.getByLabelText('CEP')).toHaveValue('73752-018');
    expect(screen.getByLabelText('Inscrição estadual')).toHaveValue('ISENTO');
  });

  it('bloqueia salvar sem CPF nem CNPJ preenchidos', async () => {
    svc.getSenderConfig.mockResolvedValue(null);
    renderWithProviders(<AdminConfigRemetente />, { preloadedState: adminAuth });

    await screen.findByLabelText('Nome do remetente');
    fireEvent.change(screen.getByLabelText('Nome do remetente'), {
      target: { value: 'Duas Marias' },
    });
    fireEvent.change(screen.getByLabelText('Endereço'), { target: { value: 'Rua da Loja' } });
    fireEvent.change(screen.getByLabelText('Número'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Bairro'), { target: { value: 'Centro' } });
    fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'Planaltina' } });
    fireEvent.change(screen.getByLabelText('UF'), { target: { value: 'GO' } });
    fireEvent.change(screen.getByLabelText('CEP'), { target: { value: '73752018' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Informe o CPF ou o CNPJ do remetente.')).toBeInTheDocument();
    expect(svc.saveSenderConfig).not.toHaveBeenCalled();
  });

  it('salva o formulario com CNPJ apenas em digitos e CEP sem mascara', async () => {
    svc.getSenderConfig.mockResolvedValue(null);
    svc.saveSenderConfig.mockResolvedValue(savedConfig);
    renderWithProviders(<AdminConfigRemetente />, { preloadedState: adminAuth });

    await screen.findByLabelText('Nome do remetente');
    fireEvent.change(screen.getByLabelText('Nome do remetente'), {
      target: { value: 'Duas Marias' },
    });
    fireEvent.change(screen.getByLabelText('CNPJ'), { target: { value: '12345678000199' } });
    fireEvent.change(screen.getByLabelText('Endereço'), { target: { value: 'Rua da Loja' } });
    fireEvent.change(screen.getByLabelText('Número'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Bairro'), { target: { value: 'Centro' } });
    fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'Planaltina' } });
    fireEvent.change(screen.getByLabelText('UF'), { target: { value: 'GO' } });
    fireEvent.change(screen.getByLabelText('CEP'), { target: { value: '73752018' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(svc.saveSenderConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Duas Marias',
          companyDocument: '12345678000199',
          document: null,
          postalCode: '73752018',
        }),
      ),
    );
    expect(await screen.findByText('Dados salvos.')).toBeInTheDocument();
  });

  it('mostra o erro do backend quando salvar falha', async () => {
    svc.getSenderConfig.mockResolvedValue(savedConfig);
    svc.saveSenderConfig.mockRejectedValue({
      response: { data: { message: 'CEP inválido.' } },
    });
    renderWithProviders(<AdminConfigRemetente />, { preloadedState: adminAuth });

    await screen.findByLabelText('Nome do remetente');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('CEP inválido.')).toBeInTheDocument();
  });
});
