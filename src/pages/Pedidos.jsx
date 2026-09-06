import { Link } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { useFetch } from '@/hooks/useFetch';
import { fetchOrders } from '@/services/orderService';
import { formatCurrency, formatDate } from '@/lib/format';
import { orderStatusLabel, orderStatusTone } from '@/lib/orderStatus';

/* Rota protegida (ver App.jsx). GET /api/orders — só os pedidos do usuário logado. */
export default function Pedidos() {
  const { status, data, error, refetch } = useFetch(fetchOrders, []);
  const orders = data || [];

  return (
    <Container className="py-10 lg:py-14">
      <h1 className="font-display text-3xl text-foreground">Meus pedidos</h1>

      <div className="mt-8">
        {status === 'loading' ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : status === 'error' ? (
          <ErrorState
            message={error}
            action={
              <Button variant="secondary" size="sm" onClick={refetch}>
                Tentar novamente
              </Button>
            }
          />
        ) : orders.length === 0 ? (
          <EmptyState
            title="Você ainda não fez nenhum pedido"
            description="Quando comprar algo, seus pedidos aparecem aqui."
            action={
              <Button as={Link} to="/produtos" variant="secondary" size="sm">
                Ver produtos
              </Button>
            }
          />
        ) : (
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {orders.map((order) => (
              <li key={order.orderId}>
                <Link
                  to={`/pedidos/${order.orderId}`}
                  className="flex items-center justify-between gap-4 py-4 hover:bg-subtle"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Pedido #{order.orderId}</p>
                    <p className="text-xs text-muted">
                      {formatDate(order.createdAt)} · {order.orderItems?.length ?? 0}{' '}
                      {(order.orderItems?.length ?? 0) === 1 ? 'item' : 'itens'}
                      {order.shippingAmount != null && (
                        <> · frete {formatCurrency(order.shippingAmount)}</>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge tone={orderStatusTone(order.orderStatus)}>
                      {orderStatusLabel(order.orderStatus)}
                    </Badge>
                    <span className="text-sm font-medium text-foreground">
                      {formatCurrency(order.totalAmount)}
                    </span>
                    <FiChevronRight className="text-muted" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
}
