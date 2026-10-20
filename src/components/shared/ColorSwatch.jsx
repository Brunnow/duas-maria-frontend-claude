import { cn } from '@/lib/cn';
import OptimizedImage from '@/components/shared/OptimizedImage';

const SIZES = {
  sm: 'h-4 w-4 text-[8px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

/**
 * Amostra de uma cor do produto: a bolinha (`hex`) ou, sem ela, a miniatura
 * da foto da cor (`image`); sem nenhuma das duas, a inicial do nome. Só
 * desenha — quem precisa de clique envolve num <button> com aria-label.
 */
export default function ColorSwatch({
  name,
  hex,
  image,
  size = 'md',
  selected,
  soldOut,
  className,
}) {
  const thumb = !hex && image ? image : null;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-subtle font-medium uppercase text-muted',
        SIZES[size],
        selected && 'ring-2 ring-foreground ring-offset-2 ring-offset-surface',
        soldOut && 'opacity-40',
        className,
      )}
      style={hex ? { backgroundColor: hex } : undefined}
    >
      {thumb ? (
        <OptimizedImage src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        !hex && (name || '?').trim().charAt(0)
      )}
      {soldOut && (
        <span className="absolute left-1/2 top-1/2 h-px w-[140%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-foreground/70" />
      )}
    </span>
  );
}
