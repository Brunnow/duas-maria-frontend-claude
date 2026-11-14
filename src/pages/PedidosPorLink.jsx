import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import OrderDetailView from '@/components/orders/OrderDetailView';
import { useFetch } from '@/hooks/useFetch';
import { fetchOrdersByAccessToken } from '@/services/publicOrderService';

/*
 * "Meus pedidos" pelo link do e-mail (/acompanhar-pedido/:token), sem login.
 * Mostra todos os pedidos feitos com o e-mail do link, mais recente primeiro.
 */
export default function PedidosPorLink() {
  const { token } = useParams();
  const fetcher = useCallback(() => fetchOrdersByAccessToken(token), [token]);
  const { status, data, error } = useFetch(fetcher, [token]);
  const orders = data?.orders || [];

  return (
    <Container className="py-10 lg:py-14">
      <h1 className="font-display text-3xl text-foreground">Meus pedidos</h1>
      {data?.maskedEmail && (
        <p className="mt-1 text-sm text-muted">Pedidos feitos com {data.maskedEmail}</p>
      )}

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
            <Button as={Link} to="/acompanhar-pedido" variant="secondary" size="sm">
              Pedir um novo link
            </Button>
          }
        />
      ) : orders.length === 0 ? (
        <EmptyState className="mt-6" title="Nenhum pedido encontrado" />
      ) : (
        <ol className="mt-6 flex flex-col gap-10">
          {orders.map((order) => (
            <li key={order.orderId} className="rounded-card border border-border p-4 sm:p-6">
              <OrderDetailView order={order} titleAs="h2" />
            </li>
          ))}
        </ol>
      )}
    </Container>
  );
}
