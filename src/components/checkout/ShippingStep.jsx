import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/format';
import { shippingMethodLabel } from '@/lib/shipping';

/*
 * Etapa de frete do checkout. A cotação em si é feita pelo Checkout
 * (efeito por UF do endereço); aqui só exibimos o estado.
 */
export default function ShippingStep({ shipping, uf, onRetry }) {
  return (
    <div>
      <h2 className="font-display text-xl text-foreground">Frete</h2>
      <p className="mt-1 text-sm text-muted">
        Calculado pela UF do endereço de entrega{uf ? ` (${uf})` : ''}.
      </p>

      <div className="mt-4 rounded-card border border-border p-4 text-sm">
        {shipping.status === 'loading' && <Skeleton className="h-6 w-40" />}

        {shipping.status === 'error' && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-danger">{shipping.error || 'Não foi possível calcular o frete.'}</p>
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Tentar novamente
            </Button>
          </div>
        )}

        {shipping.status === 'ready' && shipping.data && (
          <div className="flex items-center justify-between">
            <span className="text-muted">{shippingMethodLabel(shipping.data.shippingMethod)}</span>
            <span className="font-medium text-foreground">
              {formatCurrency(shipping.data.shippingAmount)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
