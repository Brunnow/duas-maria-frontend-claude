import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/services/viaCep', async () => {
  const actual = await vi.importActual('@/services/viaCep');
  return { ...actual, lookupCep: vi.fn() };
});

import { lookupCep, CepError } from '@/services/viaCep';
import AddressForm from './AddressForm';

const fill = (label, value) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

const fillAll = () => {
  fill('Nome de quem vai receber', 'Maria da Silva');
  fill('Telefone', '(81) 91234-5678');
  fill('CEP', '50000-000');
  fill('Logradouro', 'Rua das Flores');
  fill('Número', '123');
  fill('Bairro', 'Boa Viagem');
  fill('Cidade', 'Recife');
  fill('UF', 'PE');
};

beforeEach(() => {
  vi.clearAllMocks();
  lookupCep.mockResolvedValue({ street: '', neighborhood: '', city: '', state: '' });
});

describe('AddressForm', () => {
  it('nao envia e mostra erros quando ha campos obrigatorios vazios', () => {
    const onSubmit = vi.fn();
    render(<AddressForm onSubmit={onSubmit} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar endereço' }));
    expect(screen.getAllByText(/informe/i).length).toBeGreaterThan(0);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejeita telefone e CEP em formato invalido', () => {
    const onSubmit = vi.fn();
    render(<AddressForm onSubmit={onSubmit} onCancel={() => {}} />);
    fillAll();
    fill('Telefone', 'abc');
    fill('CEP', '123');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar endereço' }));
    expect(screen.getByText('Telefone inválido')).toBeInTheDocument();
    expect(screen.getByText(/CEP inválido/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envia o payload no formato do AddressDTO quando valido', () => {
    const onSubmit = vi.fn();
    render(<AddressForm onSubmit={onSubmit} onCancel={() => {}} />);
    fillAll();
    fill('Complemento', 'Apto 45');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar endereço' }));
    expect(onSubmit).toHaveBeenCalledWith({
      recipientName: 'Maria da Silva',
      phone: '(81) 91234-5678',
      pincode: '50000-000',
      street: 'Rua das Flores',
      number: '123',
      buildingName: 'Apto 45',
      neighborhood: 'Boa Viagem',
      city: 'Recife',
      state: 'PE',
    });
  });

  it('pre-preenche ao editar (inclui endereco legado sem os campos novos)', () => {
    render(
      <AddressForm
        initial={{
          addressId: 1,
          street: 'Rua X',
          city: 'Recife',
          state: 'PE',
          pincode: '50000000',
        }}
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByLabelText('Logradouro')).toHaveValue('Rua X');
    expect(screen.getByLabelText('CEP')).toHaveValue('50000-000');
    expect(screen.getByLabelText('Nome de quem vai receber')).toHaveValue('');
  });

  it('CEP valido: consulta o ViaCEP e preenche logradouro, bairro, cidade e UF', async () => {
    lookupCep.mockResolvedValue({
      street: 'Avenida Boa Viagem',
      neighborhood: 'Boa Viagem',
      city: 'Recife',
      state: 'PE',
    });
    render(<AddressForm onSubmit={() => {}} onCancel={() => {}} />);
    fill('CEP', '51020000');

    await waitFor(() =>
      expect(screen.getByLabelText('Logradouro')).toHaveValue('Avenida Boa Viagem'),
    );
    expect(screen.getByLabelText('Bairro')).toHaveValue('Boa Viagem');
    expect(screen.getByLabelText('Cidade')).toHaveValue('Recife');
    expect(screen.getByLabelText('UF')).toHaveValue('PE');
    // continua editavel
    fill('Logradouro', 'Outra rua');
    expect(screen.getByLabelText('Logradouro')).toHaveValue('Outra rua');
  });

  it('CEP inexistente: mostra aviso e nao bloqueia o preenchimento manual', async () => {
    lookupCep.mockRejectedValue(new CepError('notFound', 'CEP não encontrado.'));
    render(<AddressForm onSubmit={() => {}} onCancel={() => {}} />);
    fill('CEP', '99999999');
    expect(await screen.findByText(/CEP não encontrado/)).toBeInTheDocument();
  });

  it('erro de rede no ViaCEP: mostra aviso amigavel', async () => {
    lookupCep.mockRejectedValue(new CepError('network', 'x'));
    render(<AddressForm onSubmit={() => {}} onCancel={() => {}} />);
    fill('CEP', '51020000');
    expect(await screen.findByText(/Não foi possível buscar o CEP/)).toBeInTheDocument();
  });
});
