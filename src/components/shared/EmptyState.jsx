import { cn } from '@/lib/cn';

/** Estado vazio generico: icone opcional, titulo, descricao e acao. */
export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center gap-3 py-20 text-center', className)}>
      {Icon && <Icon className="text-muted" size={32} />}
      <p className="font-display text-lg text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}
