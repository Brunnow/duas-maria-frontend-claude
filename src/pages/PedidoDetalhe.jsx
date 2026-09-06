import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { useFetch } from '@/hooks/useFetch';
import { fetchOrderById } from '@/services/orderService';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { orderStatusLabel, orderStatusTone } from '@/lib/orderStatus';
import { shippingMethodLabel } from '@/lib/shipping';
import { productImageUrl } from '@/lib/media';
import { addressLines } from '@/lib/address';

// Mesma resposta (404) para "pedido inexistente" e "pedido de outro
// usuário" — tratamos as duas como "não encontrado" com uma mensagem
// amigável, em vez da mensagem técnica que a API devolve.
function fetchOrderOrFriendlyNotFound(orderId) {
  return fetchOrderById(orderId).catch((err) => {
    if (err?.response?.status === 404) {
      const friendly = new Error('Pedido não encontrado.');
      friendly.response = { data: { message: 'Pedido não encontrado.' } };
      throw friendly;
    }
    throw err;
  });
}

/* Rota protegida (ver App.jsx). GET /api/orders/{id}. */
export default function PedidoDetalhe() {
  const { id } = useParams();
  const fetcher = useCallback(() => fetchOrderOrFriendlyNotFound(id), [id]);
  const { status, data: order, error } = useFetch(fetcher, [id]);

  return (
    <Container className="py-10 lg:py-14">
      <nav className="text-xs text-muted">
        <Link to="/pedidos" className="hover:text-foreground">
          Meus pedidos
        </Link>{' '}
        / <span className="text-foreground">Pedido {id}</span>
      </nav>

      {status === 'loading' ? (
        <div className="mt-6 flex flex-col gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      ) : status === 'error' ? (
        <ErrorState
          className="mt-6"
          message={error}
          action={
            <Button as={Link} to="/pedidos" variant="secondary" size="sm">
              Voltar para meus pedidos
            </Button>
          }
        />
      ) : !order ? (
        <EmptyState className="mt-6" title="Pedido não encontrado" />
      ) : (
        <>
          <header className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl text-foreground">Pedido #{order.orderId}</h1>
              <p className="text-sm text-muted">Feito em {formatDateTime(order.createdAt)}</p>
            </div>
            <Badge tone={orderStatusTone(order.orderStatus)}>
              {orderStatusLabel(order.orderStatus)}
            </Badge>
          </header>

          <ul className="mt-8 flex flex-col divide-y divide-border border-y border-border">
            {(order.orderItems || []).map((item) => {
              const subtotal = (item.quantity ?? 0) * (item.orderedProductPrice ?? 0);
              return (
                <li key={item.orderItemId} className="flex items-center gap-4 py-4">
                  <div className="h-16 w-13 shrink-0 overflow-hidden rounded-card bg-subtle">
                    {item.product?.image && (
                      <img
                        src={productImageUrl(item.product.image)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.product?.productName || 'Produto'}
                    </p>
                    <p className="text-xs text-muted">
                      {item.size && <>Tamanho {item.size} · </>}
                      Qtd. {item.quantity} · {formatCurrency(item.orderedProductPrice)} cada
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-foreground">
                    {formatCurrency(subtotal)}
                  </p>
                </li>
              );
            })}
          </ul>

          {addressLines(order.shippingAddress).length > 0 && (
            <section className="mt-8 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Entrega
              </p>
              <div className="mt-1 text-muted">
                {addressLines(order.shippingAddress).map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </section>
          )}

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-1 text-sm">
              {order.discountAmount != null && Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-muted">
                  <span>Desconto{order.couponCode ? ` · ${order.couponCode}` : ''}</span>
                  <span>−{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              {order.shippingAmount != null && (
                <div className="flex justify-between text-muted">
                  <span>Frete · {shippingMethodLabel(order.shippingMethod)}</span>
                  <span>{formatCurrency(order.shippingAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-1 font-medium text-foreground">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </Container>
  );
}
