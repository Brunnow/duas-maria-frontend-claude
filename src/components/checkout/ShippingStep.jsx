import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/format';
import { shippingOptionLabel } from '@/lib/shipping';

/*
 * Etapa de frete do checkout (Fase ME3). A cotação em si é feita pelo
 * Checkout (efeito por CEP/UF do endereço, via /api/shipping/options); aqui
 * só exibimos o estado e deixamos o cliente escolher entre as opções
 * retornadas (Melhor Envio, ou "Entrega padrão" quando cair no fallback).
 */
export default function ShippingStep({ shipping, uf, selectedServiceId, onSelect, onRetry }) {
  const options = shipping.data || [];

  return (
    <div>
      <h2 className="font-display text-xl text-foreground">Frete</h2>
      <p className="mt-1 text-sm text-muted">
        Calculado pelo CEP do endereço de entrega{uf ? ` (${uf})` : ''}.
      </p>

      <div className="mt-4 space-y-2">
        {shipping.status === 'loading' && (
          <div className="rounded-card border border-border p-4">
            <Skeleton className="h-6 w-40" />
          </div>
        )}

        {shipping.status === 'error' && (
          <div className="flex items-center justify-between gap-3 rounded-card border border-border p-4 text-sm">
            <p className="text-danger">{shipping.error || 'Não foi possível calcular o frete.'}</p>
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Tentar novamente
            </Button>
          </div>
        )}

        {shipping.status === 'ready' &&
          options.map((option) => (
            <label
              key={option.serviceId}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-card border border-border p-4 text-sm has-[:checked]:border-foreground"
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shippingOption"
                  value={option.serviceId}
                  checked={selectedServiceId === option.serviceId}
                  onChange={() => onSelect(option.serviceId)}
                />
                <span>
                  <span className="block text-foreground">{shippingOptionLabel(option)}</span>
                  {option.deliveryDays != null && (
                    <span className="block text-xs text-muted">
                      Chega em até {option.deliveryDays}{' '}
                      {option.deliveryDays === 1 ? 'dia útil' : 'dias úteis'}
                    </span>
                  )}
                </span>
              </span>
              <span className="font-medium text-foreground">{formatCurrency(option.price)}</span>
            </label>
          ))}

        {shipping.status === 'ready' && shipping.data == null && (
          <p className="rounded-card border border-border p-4 text-sm text-danger">
            Selecione um endereço com CEP válido para calcular o frete.
          </p>
        )}

        {shipping.status === 'ready' && shipping.data != null && options.length === 0 && (
          <p className="rounded-card border border-border p-4 text-sm text-danger">
            Nenhuma opção de frete disponível para este endereço.
          </p>
        )}
      </div>
    </div>
  );
}
