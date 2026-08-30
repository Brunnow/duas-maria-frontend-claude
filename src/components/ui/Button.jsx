import { cn } from '@/lib/cn';
import Spinner from './Spinner';

const base =
  'inline-flex items-center justify-center gap-2 font-medium tracking-wide rounded-control transition-colors duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ' +
  'disabled:opacity-50 disabled:pointer-events-none';

const variants = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover',
  secondary: 'border border-foreground/20 text-foreground hover:bg-subtle',
  ghost: 'text-foreground hover:bg-subtle',
  link: 'text-accent p-0 h-auto underline-offset-4 hover:underline',
};

const sizes = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-sm',
};

/**
 * Botao base do Design System.
 * `as` permite renderizar como outro elemento (ex: Link do react-router).
 */
export default function Button({
  as: Comp = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}) {
  const isNativeButton = Comp === 'button';
  return (
    <Comp
      className={cn(base, variants[variant], variant !== 'link' && sizes[size], className)}
      disabled={isNativeButton ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      aria-disabled={!isNativeButton && (disabled || loading) ? true : undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </Comp>
  );
}
