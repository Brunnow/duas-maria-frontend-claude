import { useId } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { cn } from '@/lib/cn';

/**
 * Select nativo estilizado com os tokens do DS. Nativo por acessibilidade
 * e simplicidade; casos com busca/multiplo podem migrar para Headless UI
 * depois, se surgir a necessidade.
 */
export default function Select({ label, id, className, children, ref, ...props }) {
  const autoId = useId();
  const selectId = id || autoId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-medium uppercase tracking-wider text-muted"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'h-11 w-full appearance-none rounded-control border border-border bg-surface pl-3 pr-9 text-sm text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <FiChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          size={16}
        />
      </div>
    </div>
  );
}
