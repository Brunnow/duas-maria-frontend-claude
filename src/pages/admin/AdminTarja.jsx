import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import ErrorState from '@/components/shared/ErrorState';
import { useFetch } from '@/hooks/useFetch';
import { getStoreSettings, saveAnnouncementBar } from '@/services/storeSettingsService';

const MAX_TEXT = 160;
const MOBILE_ONE_LINE = 35;

export default function AdminTarja() {
  const { status, data, error, refetch } = useFetch(getStoreSettings, []);

  const [enabled, setEnabled] = useState(false);
  const [text, setText] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [fieldError, setFieldError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveOk, setSaveOk] = useState(false);

  // Preenche uma vez só, para um refetch não sobrescrever o que está sendo digitado.
  const [loadedOnce, setLoadedOnce] = useState(false);
  if (status === 'ready' && !loadedOnce) {
    setLoadedOnce(true);
    setEnabled(Boolean(data?.announcementEnabled));
    setText(data?.announcementText ?? '');
    setCouponCode(data?.announcementCouponCode ?? '');
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (enabled && !text.trim()) {
      setFieldError('Informe o texto da tarja para exibi-la.');
      return;
    }
    setFieldError(null);
    setSubmitting(true);
    setSaveError(null);
    setSaveOk(false);
    try {
      const result = await saveAnnouncementBar({
        enabled,
        text: text.trim() || null,
        couponCode: couponCode.trim() || null,
      });
      setCouponCode(result?.announcementCouponCode ?? '');
      setSaveOk(true);
      refetch();
    } catch (err) {
      setSaveError(err?.response?.data?.message || 'Não foi possível salvar a tarja.');
    } finally {
      setSubmitting(false);
    }
  };

  const previewCode = couponCode.trim().toUpperCase();

  return (
    <div>
      <h2 className="font-display text-xl text-foreground">Tarja do site</h2>
      <p className="mt-1 text-sm text-muted">
        Faixa no topo de todas as páginas, para avisos e promoções. Se informar um cupom, ele aparece
        como botão que copia o código. O cupom precisa estar cadastrado em &quot;Cupons&quot;.
      </p>

      {status === 'loading' ? (
        <Skeleton className="mt-6 h-48" />
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
        <form onSubmit={handleSubmit} noValidate className="mt-6 max-w-xl space-y-4">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => {
                setEnabled(event.target.checked);
                setFieldError(null);
              }}
            />
            Mostrar a tarja no site
          </label>

          <Input
            label="Texto da tarja"
            name="announcementText"
            maxLength={MAX_TEXT}
            placeholder="Ganhe 10% de desconto na sua primeira compra com o cupom"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setFieldError(null);
            }}
            error={fieldError}
            hint={`${text.length}/${MAX_TEXT} caracteres. Para caber em uma linha no celular, use até uns ${MOBILE_ONE_LINE} (ex.: "10% OFF na 1ª compra com o cupom").`}
          />

          <Input
            label="Cupom (opcional)"
            name="announcementCouponCode"
            placeholder="PRIMEIRACOMPRA"
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value)}
            hint="Deixe vazio se a tarja não divulgar cupom."
          />

          {text.trim() && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Prévia</p>
              <p className="mt-2 text-xs text-muted">Computador</p>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2 rounded-card bg-accent px-3 py-2 text-center text-sm text-accent-fg">
                <span>{text.trim()}</span>
                {previewCode && (
                  <span className="rounded-control border border-dashed border-accent-fg/70 px-2 py-0.5 font-semibold tracking-wider">
                    {previewCode}
                  </span>
                )}
              </div>
              <p className="mt-3 text-xs text-muted">Celular</p>
              <div className="mt-1 flex w-full max-w-[375px] flex-wrap items-center justify-center gap-x-2 gap-y-0.5 rounded-card bg-accent px-4 py-1.5 text-center text-[11px] leading-tight text-accent-fg">
                <span>{text.trim()}</span>
                {previewCode && (
                  <span className="rounded-control border border-dashed border-accent-fg/70 px-1.5 py-px font-semibold tracking-wide">
                    {previewCode}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" loading={submitting}>
              Salvar
            </Button>
            {saveOk && (
              <p role="status" className="text-sm text-success">
                {enabled ? 'Tarja salva e visível no site.' : 'Tarja salva (oculta no site).'}
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
