import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiX } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import {
  LAUNCH_PROMO_COUPONS,
  LAUNCH_PROMO_DELAY_MS,
  launchPromoActive,
  launchPromoHiddenOn,
} from '@/lib/launchPromo';

const STORAGE_KEY = 'dm-launch-promo-dismissed';

function wasDismissed() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberDismissed() {
  try {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Sem armazenamento (aba anônima bloqueada): o card só volta numa nova visita.
  }
}

/**
 * Card flutuante de lançamento com os cupons. Não cobre a tela nem bloqueia a
 * navegação; aparece uma vez por pessoa (fechar vale para sempre naquele
 * navegador), nunca no carrinho/checkout/login/admin e some sozinho depois da
 * data de fim (ver lib/launchPromo).
 */
export default function LaunchPromo() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(wasDismissed);
  const [copied, setCopied] = useState(null);

  const eligible = !dismissed && launchPromoActive();
  const hiddenHere = launchPromoHiddenOn(pathname);

  useEffect(() => {
    if (!eligible || open) return undefined;
    const timer = setTimeout(() => setOpen(true), LAUNCH_PROMO_DELAY_MS);
    return () => clearTimeout(timer);
  }, [eligible, open]);

  const dismiss = () => {
    rememberDismissed();
    setDismissed(true);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      rememberDismissed();
      setDismissed(true);
      setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!eligible || !open || hiddenHere) return null;

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied((current) => (current === code ? null : current)), 2000);
    } catch {
      // Sem permissão de área de transferência: o código está visível no card.
    }
  };

  return (
    <aside
      aria-label="Lançamento do site"
      className="fixed inset-x-4 bottom-24 z-40 animate-fade-in rounded-card border border-border bg-surface p-5 shadow-pop sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-80"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fechar"
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-subtle hover:text-foreground"
      >
        <FiX size={18} aria-hidden="true" />
      </button>

      <p className="pr-8 font-display text-lg leading-snug text-foreground">
        ✨ O site da Duas Maria chegou!
      </p>
      <p className="mt-1 text-sm text-muted">
        Para comemorar, use os dois cupons juntos e ganhe 30% off:
      </p>

      <ul className="mt-3 space-y-2">
        {LAUNCH_PROMO_COUPONS.map(({ code, description }) => (
          <li
            key={code}
            className="flex items-center justify-between gap-3 rounded-control border border-dashed border-border px-3 py-2"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold tracking-wide text-foreground">
                {code}
              </span>
              <span className="block text-xs text-muted">{description}</span>
            </span>
            <button
              type="button"
              onClick={() => copy(code)}
              aria-label={`Copiar cupom ${code}`}
              className="shrink-0 rounded-control px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-subtle"
            >
              {copied === code ? 'Copiado!' : 'Copiar'}
            </button>
          </li>
        ))}
      </ul>

      <Button as={Link} to="/produtos" size="sm" className="mt-4 w-full" onClick={dismiss}>
        Ver as peças
      </Button>
    </aside>
  );
}
