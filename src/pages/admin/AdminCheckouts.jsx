import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaWhatsapp } from 'react-icons/fa';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { useFetch } from '@/hooks/useFetch';
import { listCheckoutLeads } from '@/services/adminCheckoutLeadService';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { orderStatusLabel, orderStatusTone } from '@/lib/orderStatus';
import { whatsappLink } from '@/lib/contact';

const PAGE_SIZE = 20;

/*
 * "Checkouts não finalizados": quem começou a comprar sem cadastro (nome,
 * e-mail e WhatsApp preenchidos) e não terminou. O aviso no checkout diz que
 * podemos falar sobre aquele pedido; os dados somem sozinhos em 90 dias.
 */
export default function AdminCheckouts() {
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [page, setPage] = useState(1);

  const fetcher = useCallback(
    () => listCheckoutLeads({ onlyOpen, pageNumber: page - 1, pageSize: PAGE_SIZE }),
    [onlyOpen, page],
  );
  const { status, data, error, refetch } = useFetch(fetcher, [onlyOpen, page]);
  const leads = data?.content || [];

  const toggle = (value) => {
    setOnlyOpen(value);
    setPage(1);
  };

  return (
    <div>
      <h2 className="font-display text-xl text-foreground">Checkouts não finalizados</h2>
      <p className="mt-1 text-sm text-muted">
        Quem preencheu nome, e-mail e WhatsApp no checkout sem cadastro. Fale só sobre o pedido que
        a pessoa começou; os dados são apagados em 90 dias.
      </p>

      <div className="mt-4 flex gap-2" role="group" aria-label="Filtro">
        <Button size="sm" variant={onlyOpen ? 'primary' : 'secondary'} onClick={() => toggle(true)}>
          Sem pedido
        </Button>
        <Button
          size="sm"
          variant={onlyOpen ? 'secondary' : 'primary'}
          onClick={() => toggle(false)}
        >
          Todos
        </Button>
      </div>

      <div className="mt-6">
        {status === 'loading' ? (
          <div className="flex flex-col gap-2">
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
        ) : leads.length === 0 ? (
          <EmptyState
            title="Nenhum checkout"
            description={
              onlyOpen
                ? 'Ninguém desistiu no meio do checkout sem cadastro.'
                : 'Os checkouts sem cadastro aparecem aqui.'
            }
          />
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {leads.map((lead) => {
              const wa = whatsappLink(lead.phone);
              return (
                <li
                  key={lead.id}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{lead.name}</p>
                    <p className="text-xs text-muted">
                      {formatDateTime(lead.updatedAt)} · {lead.email} · {lead.phone}
                    </p>
                    {lead.itemsSummary && <p className="text-xs text-muted">{lead.itemsSummary}</p>}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    {lead.orderId ? (
                      <Link to={`/admin/pedidos/${lead.orderId}`} className="hover:underline">
                        <Badge tone={orderStatusTone(lead.orderStatus)}>
                          Pedido #{lead.orderId} · {orderStatusLabel(lead.orderStatus)}
                        </Badge>
                      </Link>
                    ) : (
                      <Badge tone="warning">Sem pedido</Badge>
                    )}
                    {lead.subtotal != null && (
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(lead.subtotal)}
                      </span>
                    )}
                    {wa && (
                      <Button
                        as="a"
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="secondary"
                        size="sm"
                      >
                        <FaWhatsapp aria-hidden="true" /> WhatsApp
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Pagination
        className="mt-8"
        page={page}
        totalPages={data?.totalPages || 0}
        onChange={setPage}
      />
    </div>
  );
}
