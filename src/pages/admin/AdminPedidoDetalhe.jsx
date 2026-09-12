import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { useFetch } from '@/hooks/useFetch';
import { getOrder, retryRefund, updateOrderStatus } from '@/services/adminOrderService';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { orderStatusLabel, orderStatusTone } from '@/lib/orderStatus';
import { paymentStatusLabel, paymentStatusTone } from '@/lib/paymentStatus';
import { shippingMethodLabel } from '@/lib/shipping';
import { productImageUrl } from '@/lib/media';
import { addressLines } from '@/lib/address';

const WEBHOOK_EVENT_STATUS_LABEL = {
  RECEIVED: 'Recebido',
  PROCESSED: 'Processado',
  FAILED: 'Falhou',
  IGNORED: 'Ignorado',
};

function getOrderOrFriendlyNotFound(orderId) {
  return getOrder(orderId).catch((err) => {
    if (err?.response?.status === 404) {
      const friendly = new Error('Pedido não encontrado.');
      friendly.response = { data: { message: 'Pedido não encontrado.' } };
      throw friendly;
    }
    throw err;
  });
}

export default function AdminPedidoDetalhe() {
  const { id } = useParams();
  const fetcher = useCallback(() => getOrderOrFriendlyNotFound(id), [id]);
  const { status, data: detail, error, refetch } = useFetch(fetcher, [id]);

  const [target, setTarget] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [changeError, setChangeError] = useState(null);
  const [changeOk, setChangeOk] = useState(null);

  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState(null);

  const submitRetryRefund = async () => {
    setRefunding(true);
    setRefundError(null);
    try {
      await retryRefund(id);
      refetch();
    } catch (err) {
      setRefundError(err?.response?.data?.message || 'Não foi possível tentar o estorno agora.');
    } finally {
      setRefunding(false);
    }
  };

  const submitStatus = async (event) => {
    event.preventDefault();
    if (!target) return;
    setSubmitting(true);
    setChangeError(null);
    setChangeOk(null);
    try {
      await updateOrderStatus(id, { status: target, note: note.trim() || undefined });
      setChangeOk(`Status alterado para ${orderStatusLabel(target)}.`);
      setTarget('');
      setNote('');
      refetch();
    } catch (err) {
      setChangeError(
        err?.response?.data?.message || 'Não foi possível alterar o status do pedido.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const order = detail?.order;
  const nextOptions = detail?.allowedNextStatus || [];
  const history = detail?.statusHistory || [];
  const payment = order?.payment;
  const webhookEvents = detail?.webhookEvents || [];

  return (
    <div>
      <nav className="text-xs text-muted">
        <Link to="/admin/pedidos" className="hover:text-foreground">
          Pedidos
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
            <Button as={Link} to="/admin/pedidos" variant="secondary" size="sm">
              Voltar para pedidos
            </Button>
          }
        />
      ) : !order ? (
        <EmptyState className="mt-6" title="Pedido não encontrado" />
      ) : (
        <>
          <header className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-foreground">Pedido #{order.orderId}</h2>
              <p className="text-sm text-muted">Feito em {formatDateTime(order.createdAt)}</p>
            </div>
            <Badge tone={orderStatusTone(order.orderStatus)}>
              {orderStatusLabel(order.orderStatus)}
            </Badge>
          </header>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ul className="flex flex-col divide-y divide-border border-y border-border">
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
                          {item.sku && <>{item.sku} · </>}
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
            </div>

            <aside className="space-y-8">
              <section className="text-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Cliente
                </p>
                <div className="mt-1 text-muted">
                  <p>{detail.customerName}</p>
                  {detail.customerUsername && <p>@{detail.customerUsername}</p>}
                  <p>{order.email}</p>
                </div>
              </section>

              {addressLines(order.shippingAddress).length > 0 && (
                <section className="text-sm">
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

              {payment && (
                <section className="text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Pagamento
                  </p>
                  <div className="mt-2 flex flex-col gap-1.5">
                    <Badge tone={paymentStatusTone(payment.status)} className="w-fit">
                      {paymentStatusLabel(payment.status)}
                    </Badge>
                    <div className="text-muted">
                      {payment.provider && <p>Provedor: {payment.provider}</p>}
                      {payment.providerPaymentId && (
                        <p>Id do pagamento: {payment.providerPaymentId}</p>
                      )}
                      {payment.amount != null && <p>Valor: {formatCurrency(payment.amount)}</p>}
                      {payment.paidAt && <p>Pago em: {formatDateTime(payment.paidAt)}</p>}
                      {payment.refundedAt && (
                        <p>Estornado em: {formatDateTime(payment.refundedAt)}</p>
                      )}
                    </div>
                    {payment.status === 'REFUND_PENDING' && (
                      <div className="mt-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={refunding}
                          onClick={submitRetryRefund}
                        >
                          Tentar estorno novamente
                        </Button>
                        {refundError && (
                          <p role="alert" className="mt-1.5 text-xs text-danger">
                            {refundError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}

              <section className="text-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Alterar status
                </p>
                {nextOptions.length === 0 ? (
                  <p className="mt-1 text-muted">
                    Este pedido está em um status final e não pode ser alterado.
                  </p>
                ) : (
                  <form onSubmit={submitStatus} className="mt-2 space-y-3">
                    <Select
                      label="Novo status"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                    >
                      <option value="">Selecione…</option>
                      {nextOptions.map((s) => (
                        <option key={s} value={s}>
                          {orderStatusLabel(s)}
                        </option>
                      ))}
                    </Select>
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="status-note"
                        className="text-xs font-medium uppercase tracking-wider text-muted"
                      >
                        Observação (opcional)
                      </label>
                      <textarea
                        id="status-note"
                        rows={2}
                        value={note}
                        maxLength={500}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      />
                    </div>
                    {target === 'CANCELADO' && (
                      <p className="text-xs text-warning">Cancelar devolve os itens ao estoque.</p>
                    )}
                    <Button type="submit" size="sm" loading={submitting} disabled={!target}>
                      Salvar status
                    </Button>
                    {changeError && (
                      <p role="alert" className="text-xs text-danger">
                        {changeError}
                      </p>
                    )}
                    {changeOk && (
                      <p role="status" className="text-xs text-success">
                        {changeOk}
                      </p>
                    )}
                  </form>
                )}
              </section>

              <section className="text-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Histórico
                </p>
                <ol className="mt-2 space-y-2 text-xs text-muted">
                  {history.map((h) => (
                    <li key={h.id}>
                      <span className="text-foreground">{orderStatusLabel(h.toStatus)}</span>
                      {h.fromStatus && <> (de {orderStatusLabel(h.fromStatus)})</>} ·{' '}
                      {formatDateTime(h.changedAt)}
                      {h.changedBy && <> · {h.changedBy}</>}
                      {h.note && <span className="block italic">{h.note}</span>}
                    </li>
                  ))}
                </ol>
              </section>

              {webhookEvents.length > 0 && (
                <section className="text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Eventos de webhook
                  </p>
                  <ol className="mt-2 space-y-2 text-xs text-muted">
                    {webhookEvents.map((e) => (
                      <li key={e.id}>
                        <span className="text-foreground">{e.topic}</span> ·{' '}
                        {WEBHOOK_EVENT_STATUS_LABEL[e.status] || e.status} ·{' '}
                        {formatDateTime(e.receivedAt)}
                        {e.error && <span className="block text-danger">{e.error}</span>}
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
