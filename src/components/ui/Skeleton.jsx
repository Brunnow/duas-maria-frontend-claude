import { cn } from '@/lib/cn';

/** Bloco de carregamento (placeholder animado). */
export default function Skeleton({ className }) {
  return (
    <div className={cn('animate-pulse rounded-card bg-subtle', className)} aria-hidden="true" />
  );
}
