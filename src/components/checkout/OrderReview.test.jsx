import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrderReview from './OrderReview';

const items = [
  { cartItemId: 1, productName: 'Vestido Midi', size: 'M', quantity: 1, lineTotal: 200, image: '' },
];
const shipping = { shippingAmount: 14.9, shippingMethod: 'FIXED_UF' };

describe('OrderReview', () => {
  it('sem cupom: A pagar = produtos + frete, sem linha de desconto', () => {
    render(<OrderReview items={items} address={null} shipping={shipping} coupon={null} />);

    // 200 + 14,90
    expect(screen.getByText(/R\$\s*214,90/)).toBeInTheDocument();
    expect(screen.queryByText(/Desconto/)).not.toBeInTheDocument();
  });

  it('com cupom: mostra o desconto e subtrai do total', () => {
    render(
      <OrderReview
        items={items}
        address={null}
        shipping={shipping}
        coupon={{ code: 'PROMO10', discountAmount: 20 }}
      />,
    );

    expect(screen.getByText(/Desconto.*PROMO10/)).toBeInTheDocument();
    // 200 - 20 + 14,90
    expect(screen.getByText(/R\$\s*194,90/)).toBeInTheDocument();
  });

  it('nunca deixa o desconto passar do subtotal de produtos', () => {
    render(
      <OrderReview
        items={items}
        address={null}
        shipping={shipping}
        coupon={{ code: 'BIG', discountAmount: 500 }}
      />,
    );

    // desconto travado em 200 -> A pagar = 0 + 14,90 (aparece no frete e no "A pagar")
    expect(screen.getAllByText(/R\$\s*14,90/)).toHaveLength(2);
  });
});
