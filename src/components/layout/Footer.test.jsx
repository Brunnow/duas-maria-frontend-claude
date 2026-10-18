import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

const renderFooter = () =>
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );

describe('Footer', () => {
  it('mostra telefone e e-mail de atendimento com links que funcionam', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: '(61) 99573-0440' })).toHaveAttribute(
      'href',
      'tel:+5561995730440',
    );
    expect(screen.getByRole('link', { name: 'atendimento.duasmaria@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:atendimento.duasmaria@gmail.com',
    );
  });

  it('linka as redes sociais em nova aba', () => {
    renderFooter();
    const socials = within(screen.getByRole('list', { name: 'Redes sociais' }));
    expect(socials.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
      'href',
      'https://www.instagram.com/duas.marias23/',
    );
    expect(socials.getByRole('link', { name: 'Facebook' })).toHaveAttribute(
      'href',
      'https://www.facebook.com/share/18WAySHd8E/',
    );
    expect(socials.getByRole('link', { name: 'Instagram' })).toHaveAttribute('target', '_blank');
  });

  it('lista as formas de pagamento e as garantias de compra segura', () => {
    renderFooter();
    const payments = within(screen.getByRole('list', { name: 'Formas de pagamento' }));
    for (const method of ['Pix', 'Visa', 'Mastercard', 'Elo', 'Boleto']) {
      expect(payments.getByText(method)).toBeInTheDocument();
    }
    expect(screen.getByText('Cartão de crédito em até 6x sem juros.')).toBeInTheDocument();
    expect(screen.getByText('Processado pelo Mercado Pago')).toBeInTheDocument();
  });
});
