import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import AddressForm from './AddressForm';

const fill = (label, value) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

const fillAll = () => {
  fill('Rua', 'Rua das Flores');
  fill('Complemento / Número', 'Apto 101');
  fill('Cidade', 'Recife');
  fill('Estado', 'PE');
  fill('País', 'Brasil');
  fill('CEP', '50000000');
};

describe('AddressForm', () => {
  it('nao envia e mostra erros quando ha campos invalidos', () => {
    const onSubmit = vi.fn();
    render(<AddressForm onSubmit={onSubmit} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar endereço' }));
    expect(screen.getAllByText(/campo obrigatório/i).length).toBeGreaterThan(0);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envia os valores quando o formulario e valido', () => {
    const onSubmit = vi.fn();
    render(<AddressForm onSubmit={onSubmit} onCancel={() => {}} />);
    fillAll();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar endereço' }));
    expect(onSubmit).toHaveBeenCalledWith({
      street: 'Rua das Flores',
      buildingName: 'Apto 101',
      city: 'Recife',
      state: 'PE',
      country: 'Brasil',
      pincode: '50000000',
    });
  });

  it('pre-preenche os campos ao editar', () => {
    render(
      <AddressForm
        initial={{
          addressId: 1,
          street: 'Rua X',
          buildingName: 'Bloco B',
          city: 'City',
          state: 'ST',
          country: 'BR',
          pincode: '12345',
        }}
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByLabelText('Rua')).toHaveValue('Rua X');
    expect(screen.getByLabelText('CEP')).toHaveValue('12345');
  });
});
