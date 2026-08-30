import { cn } from '@/lib/cn';
import { discountPercent, formatCurrency } from '@/lib/format';

/**
 * Exibe o preco de um produto em BRL, tratando preco promocional e,
 * opcionalmente, o percentual de desconto.
 */
export default function Price({ price, specialPrice, showDiscount = false, className }) {
  const hasSpecial =
    specialPrice != null && Number(specialPrice) > 0 && Number(specialPrice) < Number(price);
  const pct = hasSpecial ? discountPercent(price, specialPrice) : null;

  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span className="font-medium text-foreground">
        {formatCurrency(hasSpecial ? specialPrice : price)}
      </span>
      {hasSpecial && (
        <span className="text-sm text-muted line-through">{formatCurrency(price)}</span>
      )}
      {hasSpecial && showDiscount && pct != null && (
        <span className="text-xs font-semibold text-accent">-{pct}%</span>
      )}
    </div>
  );
}
