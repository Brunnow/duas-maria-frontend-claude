import { useState } from 'react';
import Container from '@/components/ui/Container';
import { useFetch } from '@/hooks/useFetch';
import { getPublicStoreSettings } from '@/services/storeSettingsService';

/*
 * Tarja do topo do site, editada no admin. Não renderiza nada se estiver
 * desligada ou se a configuração não carregar — nunca atrapalha a navegação.
 */
export default function AnnouncementBar() {
  const { status, data } = useFetch(getPublicStoreSettings, []);
  const [copied, setCopied] = useState(false);

  if (status !== 'ready' || !data?.announcementEnabled || !data.announcementText) return null;

  const code = data.announcementCouponCode;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sem permissão de área de transferência: o código já está visível na tarja.
    }
  };

  return (
    <div className="bg-accent text-accent-fg">
      <Container className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 py-1.5 text-center text-[11px] leading-tight sm:py-2 sm:text-sm">
        <span>{data.announcementText}</span>
        {code && (
          <button
            type="button"
            onClick={copy}
            aria-label={`Copiar cupom ${code}`}
            className="rounded-control border border-dashed border-accent-fg/70 px-1.5 py-px font-semibold tracking-wide transition-colors hover:bg-accent-fg/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-fg/60 sm:px-2 sm:py-0.5 sm:tracking-wider"
          >
            {code}
          </button>
        )}
        <span aria-live="polite" className="sr-only sm:not-sr-only sm:text-xs sm:opacity-90">
          {copied ? 'Cupom copiado!' : ''}
        </span>
      </Container>
    </div>
  );
}
