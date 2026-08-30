import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { cn } from '@/lib/cn';

const GAP = '…';

/** Monta a lista de paginas visiveis: 1, ultima, atual +/-1 e reticencias. */
export function buildPages(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const wanted = [1, 2, total - 1, total, page - 1, page, page + 1];
  const shown = [...new Set(wanted)].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result = [];
  shown.forEach((p, i) => {
    if (i > 0 && p - shown[i - 1] > 1) result.push(GAP);
    result.push(p);
  });
  return result;
}

/** Paginacao numerica com anterior/proximo. Nao renderiza nada se ha <= 1 pagina. */
export default function Pagination({ page, totalPages, onChange, className }) {
  if (!totalPages || totalPages <= 1) return null;

  const go = (target) => {
    if (target >= 1 && target <= totalPages && target !== page) onChange(target);
  };

  return (
    <nav className={cn('flex items-center justify-center gap-1', className)} aria-label="Paginação">
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
        className="flex h-9 items-center gap-1 rounded-control px-3 text-sm text-foreground hover:bg-subtle disabled:pointer-events-none disabled:opacity-40"
      >
        <FiChevronLeft size={16} />
        <span className="hidden sm:inline">Anterior</span>
      </button>

      {buildPages(page, totalPages).map((item, i) =>
        item === GAP ? (
          <span key={`gap-${i}`} className="px-2 text-muted" aria-hidden="true">
            {GAP}
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => go(item)}
            aria-current={item === page ? 'page' : undefined}
            className={cn(
              'h-9 min-w-9 rounded-control px-2 text-sm',
              item === page ? 'bg-accent text-accent-fg' : 'text-foreground hover:bg-subtle',
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        aria-label="Próxima página"
        className="flex h-9 items-center gap-1 rounded-control px-3 text-sm text-foreground hover:bg-subtle disabled:pointer-events-none disabled:opacity-40"
      >
        <span className="hidden sm:inline">Próximo</span>
        <FiChevronRight size={16} />
      </button>
    </nav>
  );
}
