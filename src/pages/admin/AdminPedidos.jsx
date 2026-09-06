import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { useFetch } from '@/hooks/useFetch';
import { listOrders } from '@/services/adminOrderService';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { ORDER_STATUS_VALUES, orderStatusLabel, orderStatusTone } from '@/lib/orderStatus';

const PAGE_SIZE = 20;

export default function AdminPedidos() {
  // Filtros aplicados (o que vai para a API) vs. rascunho nos inputs.
  const [filters, setFilters] = useState({ status: '', q: '', from: '', to: '' });
  const [draft, setDraft] = useState(filters);
  const [page, setPage] = useState(1);

  const fetcher = useCallback(
    () => listOrders({ ...filters, pageNumber: page - 1, pageSize: PAGE_SIZE }),
    [filters, page],
  );
  const { status, data, error, refetch } = useFetch(fetcher, [filters, page]);

  const orders = data?.content || [];
  const totalPages = data?.totalPages || 0;

  const hasActiveFilters = useMemo(() => Object.values(filters).some(Boolean), [filters]);

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setFilters(draft);
  };

  const clearFilters = () => {
    const empty = { status: '', q: '', from: '', to: '' };
    setDraft(empty);
    setPage(1);
    setFilters(empty);
  };

  return (
    <div>
      <h2 className="font-display text-xl text-foreground">Pedidos</h2>

      <form
        onSubmit={applyFilters}
        className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
      >
        <Select
          label="Status"
          value={draft.status}
          onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
        >
          <option value="">Todos</option>
          {ORDER_STATUS_VALUES.map((s) => (
            <option key={s} value={s}>
              {orderStatusLabel(s)}
            </option>
          ))}
        </Select>
        <Input
          label="Buscar"
          placeholder="Nº do pedido, e-mail ou cliente"
          value={draft.q}
          onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
        />
        <Input
          label="De"
          type="date"
          value={draft.from}
          onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
        />
        <Input
          label="Até"
          type="date"
          value={draft.to}
          onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
        />
        <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
          <Button type="submit" size="sm">
            Filtrar
          </Button>
          {hasActiveFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
              Limpar
            </Button>
          )}
        </div>
      </form>

      <div className="mt-6">
        {status === 'loading' ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
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
            title="Nenhum pedido"
            description={
              hasActiveFilters
                ? 'Nenhum pedido corresponde aos filtros.'
                : 'Os pedidos dos clientes aparecem aqui.'
            }
          />
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {orders.map((order) => (
              <li key={order.orderId}>
                <Link
                  to={`/admin/pedidos/${order.orderId}`}
                  className="flex items-center justify-between gap-4 py-4 hover:bg-subtle"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Pedido #{order.orderId}</p>
                    <p className="text-xs text-muted">
                      {formatDateTime(order.createdAt)} · {order.customerName || order.email}
                      {order.city && order.state && (
                        <>
                          {' '}
                          · {order.city}/{order.state}
                        </>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {order.itemCount} {order.itemCount === 1 ? 'item' : 'itens'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge tone={orderStatusTone(order.status)}>
                      {orderStatusLabel(order.status)}
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

      <Pagination className="mt-8" page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
