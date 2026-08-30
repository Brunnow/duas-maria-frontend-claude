import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SizeSelector from './SizeSelector';

const variants = [
  { variantId: 10, size: 'P', stock: 3, inStock: true },
  { variantId: 11, size: 'M', stock: 0, inStock: false },
  { variantId: 12, size: 'G', stock: 5, inStock: true },
];

describe('SizeSelector', () => {
  it('lista os tamanhos e desabilita os sem estoque', () => {
    render(<SizeSelector variants={variants} value={null} onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: 'P' })).toBeEnabled();
    expect(screen.getByRole('radio', { name: 'M' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'G' })).toBeEnabled();
  });

  it('chama onChange com o variantId ao selecionar um tamanho disponivel', () => {
    const onChange = vi.fn();
    render(<SizeSelector variants={variants} value={null} onChange={onChange} />);
    screen.getByRole('radio', { name: 'P' }).click();
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('nao seleciona tamanho sem estoque', () => {
    const onChange = vi.fn();
    render(<SizeSelector variants={variants} value={null} onChange={onChange} />);
    screen.getByRole('radio', { name: 'M' }).click();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('marca o tamanho selecionado', () => {
    render(<SizeSelector variants={variants} value={12} onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: 'G' })).toBeChecked();
  });
});
