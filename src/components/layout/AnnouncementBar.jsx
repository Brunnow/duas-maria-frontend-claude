import { useEffect, useState } from 'react';
import Container from '@/components/ui/Container';
import { useFetch } from '@/hooks/useFetch';
import { getPublicStoreSettings } from '@/services/storeSettingsService';

const CACHE_KEY = 'dm-announcement';

/** Última tarja vista neste navegador: { text, code } ou { off: true }; null se nunca carregou. */
function readCached() {
  try {
    const value = JSON.parse(window.localStorage.getItem(CACHE_KEY));
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
}

function writeCached(value) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    // Sem armazenamento: só perde o atalho da próxima visita.
  }
}

function toBar(data) {
  return data?.announcementEnabled && data.announcementText
    ? { text: data.announcementText, code: data.announcementCouponCode || null }
    : { off: true };
}

/*
 * Tarja do topo do site, editada no admin. Não renderiza nada se estiver
 * desligada ou se a configuração não carregar — nunca atrapalha a navegação.
 *
 * Para a página não "pular" quando a tarja chega da API (CLS): mostra na hora
 * a última tarja vista neste navegador e, na primeira visita, reserva o espaço
 * com a faixa vazia enquanto carrega.
 */
export default function AnnouncementBar() {
  const { status, data } = useFetch(getPublicStoreSettings, []);
  const [cached] = useState(readCached);
  const [copied, setCopied] = useState(false);

  const fresh = status === 'ready' ? toBar(data) : null;

  useEffect(() => {
    if (fresh) writeCached(fresh);
  }, [fresh?.off, fresh?.text, fresh?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  const bar = fresh || (status === 'loading' ? cached : null);

  if (!bar) {
    // Primeira visita, ainda carregando: guarda o lugar da tarja (altura medida
    // da tarja de uma linha + cupom).
    return status === 'loading' ? (
      <div aria-hidden="true" className="h-[45.5px] bg-accent sm:h-[39.5px]" />
    ) : null;
  }
  if (bar.off) return null;

  const { text, code } = bar;

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
        <span>{text}</span>
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
