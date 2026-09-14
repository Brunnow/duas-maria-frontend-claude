import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';
import { shippingOptionLabel } from '@/lib/shipping';

export default function OrderConfirmation({ order }) {
  const hasShipping = order.shippingAmount != null;
  return (
    <div className="mx-auto max-w-lg text-center">
      <p className="font-display text-2xl text-foreground">Pedido realizado!</p>
      <p className="mt-2 text-sm text-muted">
        Pedido <span className="font-medium text-foreground">#{order.orderId}</span> —{' '}
        {order.orderStatus}
      </p>

      <div className="mt-6 rounded-card border border-border p-5 text-left text-sm">
        <ul className="divide-y divide-border">
          {order.orderItems?.map((item) => (
            <li key={item.orderItemId} className="flex items-center justify-between gap-2 py-2">
              <span className="text-muted">
                {item.product?.productName || item.sku} · Tam. {item.size} · {item.quantity}x
              </span>
              <span className="text-foreground">
                {formatCurrency(item.orderedProductPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        {order.discountAmount != null && Number(order.discountAmount) > 0 && (
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-muted">
            <span>Desconto{order.couponCode ? ` · ${order.couponCode}` : ''}</span>
            <span>−{formatCurrency(order.discountAmount)}</span>
          </div>
        )}
        {hasShipping && (
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-muted">
            <span>
              Frete ·{' '}
              {shippingOptionLabel({
                carrierName: order.shippingCarrierName,
                serviceName: order.shippingServiceName,
              })}
            </span>
            <span>{formatCurrency(order.shippingAmount)}</span>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-medium">
          <span>Total</span>
          <span>{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button as={Link} to={`/pedidos/${order.orderId}`} variant="secondary">
          Ver detalhes do pedido
        </Button>
        <Button as={Link} to="/produtos">
          Continuar comprando
        </Button>
      </div>
    </div>
  );
}
