import { cn } from '@/lib/cn';

/** Indicador de passos do checkout. */
export default function StepNav({ steps, current, className }) {
  return (
    <ol className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 text-sm', className)}>
      {steps.map((label, index) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full text-xs',
              index <= current ? 'bg-accent text-accent-fg' : 'bg-subtle text-muted',
            )}
          >
            {index + 1}
          </span>
          <span className={index === current ? 'text-foreground' : 'text-muted'}>{label}</span>
          {index < steps.length - 1 && <span className="h-px w-6 bg-border" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}
