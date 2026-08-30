import { cn } from '@/lib/cn';

const tones = {
  neutral: 'bg-subtle text-foreground',
  accent: 'bg-accent text-accent-fg',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
};

/** Selo curto para status (estoque, desconto, etiquetas). */
export default function Badge({ tone = 'neutral', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-control px-2 py-1 text-[11px] font-semibold uppercase tracking-wider',
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
