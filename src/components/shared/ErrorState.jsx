import { FiAlertTriangle } from 'react-icons/fi';
import { cn } from '@/lib/cn';

/** Estado de erro generico (falha ao carregar dados). */
export default function ErrorState({ title = 'Algo deu errado', message, action, className }) {
  return (
    <div className={cn('flex flex-col items-center gap-3 py-20 text-center', className)}>
      <FiAlertTriangle className="text-danger" size={32} />
      <p className="font-display text-lg text-foreground">{title}</p>
      {message && <p className="max-w-sm text-sm text-muted">{message}</p>}
      {action}
    </div>
  );
}
