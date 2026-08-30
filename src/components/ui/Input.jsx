import { useId } from 'react';
import { cn } from '@/lib/cn';

/**
 * Campo de texto com label, dica e mensagem de erro.
 * Aceita `ref` diretamente (React 19) para uso com libs de formulario.
 */
export default function Input({ label, error, hint, className, id, ref, ...props }) {
  const autoId = useId();
  const inputId = id || autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium uppercase tracking-wider text-muted"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground',
          'placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
          error && 'border-danger focus-visible:ring-danger/30',
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {error ? (
        <span id={`${inputId}-error`} className="text-xs text-danger">
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className="text-xs text-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
