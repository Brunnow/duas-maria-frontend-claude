import { formatCurrency } from '@/lib/format';
import { addressLines } from '@/lib/address';
import { shippingMethodLabel } from '@/lib/shipping';

export default function OrderReview({ items, address, shipping, coupon }) {
  const productsTotal = items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
  const count = items.reduce((n, item) => n + (item.quantity || 0), 0);
  const shippingAmount = Number(shipping?.shippingAmount) || 0;
  // Preview: o backend recalcula o desconto ao criar o pedido.
  const discount = Math.min(Number(coupon?.discountAmount) || 0, productsTotal);
  const total = productsTotal - discount + shippingAmount;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <h2 className="font-display text-xl text-foreground">Revisão do pedido</h2>

        <ul className="mt-4 divide-y divide-border border-y border-border">
          {items.map((item) => (
            <li key={item.cartItemId} className="flex items-center gap-3 py-3 text-sm">
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded-card bg-subtle">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-foreground">{item.productName}</p>
                <p className="text-xs text-muted">
                  Tam. {item.size} · {item.quantity}x
                </p>
              </div>
              <span className="text-foreground">{formatCurrency(item.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Entrega</p>
          {address ? (
            <div className="mt-1 text-muted">
              {addressLines(address).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-danger">Endereço não selecionado</p>
          )}
        </div>

        <div className="mt-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Pagamento
          </p>
          <p className="mt-1 text-muted">
            Você escolhe Pix, cartão ou boleto na página do Mercado Pago, no próximo passo.
          </p>
        </div>
      </div>

      <aside className="h-fit rounded-card border border-border p-5">
        <h3 className="font-display text-lg text-foreground">Total</h3>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted">
            Produtos ({count} {count === 1 ? 'item' : 'itens'})
          </span>
          <span className="text-foreground">{formatCurrency(productsTotal)}</span>
        </div>
        {discount > 0 && (
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted">Desconto{coupon?.code ? ` · ${coupon.code}` : ''}</span>
            <span className="text-foreground">−{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted">
            Frete
            {shipping?.shippingMethod ? ` · ${shippingMethodLabel(shipping.shippingMethod)}` : ''}
          </span>
          <span className="text-foreground">{formatCurrency(shippingAmount)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-sm font-medium">
          <span>A pagar</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </aside>
    </div>
  );
}
