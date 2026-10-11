import { useFetch } from '@/hooks/useFetch';
import { formatCurrency } from '@/lib/format';
import { getPublicStoreSettings } from '@/services/storeSettingsService';

/*
 * "Faltam R$ X para frete grátis". Não renderiza nada se o frete grátis
 * estiver desativado ou se a configuração não carregar — é um incentivo,
 * não pode atrapalhar o carrinho. A regra real fica no backend.
 */
export default function FreeShippingProgress({ subtotal, className }) {
  const { status, data } = useFetch(getPublicStoreSettings, []);
  const min = Number(data?.freeShippingMinAmount);
  if (status !== 'ready' || !min) return null;

  const current = Number(subtotal) || 0;
  const missing = min - current;
  const reached = missing <= 0;
  const percent = Math.min(100, Math.round((current / min) * 100));

  return (
    <div className={className}>
      <p className="text-sm text-foreground">
        {reached ? (
          <>
            Você ganhou <strong className="font-semibold">frete grátis</strong>!
          </>
        ) : (
          <>
            Faltam <strong className="font-semibold">{formatCurrency(missing)}</strong> para ganhar
            frete grátis.
          </>
        )}
      </p>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-subtle"
        role="progressbar"
        aria-label="Progresso para frete grátis"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className={reached ? 'h-full bg-success' : 'h-full bg-accent'}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
