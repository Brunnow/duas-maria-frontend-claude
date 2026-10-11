import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import ErrorState from '@/components/shared/ErrorState';
import { useFetch } from '@/hooks/useFetch';
import { formatCurrency } from '@/lib/format';
import { getStoreSettings, saveStoreSettings } from '@/services/storeSettingsService';

export default function AdminFreteGratis() {
  const { status, data, error, refetch } = useFetch(getStoreSettings, []);

  const [value, setValue] = useState('');
  const [fieldError, setFieldError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(null);

  // Preenche uma vez só, para um refetch não sobrescrever o que está sendo digitado.
  const [loadedOnce, setLoadedOnce] = useState(false);
  if (status === 'ready' && !loadedOnce) {
    setLoadedOnce(true);
    setValue(data?.freeShippingMinAmount != null ? String(data.freeShippingMinAmount) : '');
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = value.trim();
    const amount = trimmed === '' ? null : Number(trimmed);
    if (amount !== null && (!Number.isFinite(amount) || amount <= 0)) {
      setFieldError('Informe um valor maior que zero, ou deixe vazio para desativar.');
      return;
    }

    setFieldError(null);
    setSubmitting(true);
    setSaveError(null);
    setSaved(null);
    try {
      const result = await saveStoreSettings({ freeShippingMinAmount: amount });
      setSaved({ amount: result?.freeShippingMinAmount ?? null });
      refetch();
    } catch (err) {
      setSaveError(err?.response?.data?.message || 'Não foi possível salvar o frete grátis.');
    } finally {
      setSubmitting(false);
    }
  };

  const current = data?.freeShippingMinAmount;

  return (
    <div>
      <h2 className="font-display text-xl text-foreground">Frete grátis</h2>
      <p className="mt-1 text-sm text-muted">
        Quando o valor dos produtos no carrinho (antes do cupom) chegar ao mínimo, o PAC dos Correios
        fica grátis para a cliente (se o PAC não estiver disponível para o CEP, a opção mais barata
        fica grátis no lugar). O SEDEX ganha um desconto do mesmo valor, e a cliente paga só a
        diferença. As demais transportadoras continuam com o preço normal. A etiqueta continua
        sendo comprada no Melhor Envio, paga pela loja.
      </p>

      {status === 'loading' ? (
        <Skeleton className="mt-6 h-32" />
      ) : status === 'error' ? (
        <ErrorState
          className="mt-6"
          message={error}
          action={
            <Button variant="secondary" size="sm" onClick={refetch}>
              Tentar novamente
            </Button>
          }
        />
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-6 max-w-sm space-y-4">
          <p className="text-sm text-foreground">
            {current != null
              ? `Ativo: frete grátis a partir de ${formatCurrency(current)}.`
              : 'Desativado no momento.'}
          </p>
          <Input
            label="Frete grátis a partir de (R$)"
            name="freeShippingMinAmount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Ex.: 299,90"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setFieldError(null);
            }}
            error={fieldError}
            hint="Deixe vazio para desativar o frete grátis."
          />

          <div className="flex items-center gap-3">
            <Button type="submit" loading={submitting}>
              Salvar
            </Button>
            {saved && (
              <p role="status" className="text-sm text-success">
                {saved.amount != null ? 'Frete grátis atualizado.' : 'Frete grátis desativado.'}
              </p>
            )}
            {saveError && (
              <p role="alert" className="text-sm text-danger">
                {saveError}
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
