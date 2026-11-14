import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import OrderDetailView from '@/components/orders/OrderDetailView';
import { useFetch } from '@/hooks/useFetch';
import { fetchOrderById } from '@/services/orderService';

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
        <OrderDetailView order={order} />
      )}
    </Container>
  );
}
