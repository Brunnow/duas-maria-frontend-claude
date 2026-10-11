import { useEffect, useState } from 'react';
import Container from '@/components/ui/Container';
import { useFetch } from '@/hooks/useFetch';
import { cn } from '@/lib/cn';
import { HIGHLIGHT_ICONS, highlightText } from '@/lib/highlights';
import { getPublicStoreSettings } from '@/services/storeSettingsService';

const ROTATE_MS = 4000;

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

/*
 * Faixa de benefícios abaixo da capa. Computador (lg+): todos os itens lado a
 * lado, parados. Celular e tablet: um por vez, trocando a cada 4s (pausa ao tocar/focar; sem
 * troca automática para quem pede menos movimento). Os itens não visíveis
 * ficam só para leitores de tela (sr-only), nunca escondidos deles.
 */
export default function HighlightsStrip() {
  const { status, data } = useFetch(getPublicStoreSettings, []);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const items =
    status === 'ready'
      ? (data?.highlights || [])
          .map((item) => ({ ...item, label: highlightText(item, data.freeShippingMinAmount) }))
          .filter((item) => item.label)
      : [];

  const rotates = items.length > 1 && !paused && !prefersReducedMotion();

  useEffect(() => {
    if (!rotates) return undefined;
    const timer = setInterval(() => setActive((i) => (i + 1) % items.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [rotates, items.length]);

  if (items.length === 0) return null;
  const current = active % items.length;

  return (
    <section aria-label="Benefícios" className="border-b border-border bg-surface">
      <Container>
        <ul
          className="flex min-h-12 items-center justify-center py-3 lg:gap-x-10 xl:gap-x-16"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {items.map((item, index) => {
            const { Icon } = HIGHLIGHT_ICONS[item.icon] || HIGHLIGHT_ICONS.STAR;
            const isCurrent = index === current;
            return (
              <li
                key={`${item.kind}-${index}`}
                className={cn(
                  'flex items-center gap-2 text-xs tracking-wide text-foreground sm:text-sm',
                  isCurrent ? 'max-lg:motion-safe:animate-fade-in' : 'max-lg:sr-only',
                )}
              >
                <Icon aria-hidden="true" className="shrink-0 text-accent" size={18} />
                <span>{item.label}</span>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
