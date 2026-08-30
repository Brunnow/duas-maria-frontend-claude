import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';

export default function OrderConfirmation({ order }) {
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
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-medium">
          <span>Total</span>
          <span>{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted">
        O histórico de pedidos ainda não está disponível na sua conta.
      </p>
      <Button as={Link} to="/produtos" className="mt-6">
        Continuar comprando
      </Button>
    </div>
  );
}
