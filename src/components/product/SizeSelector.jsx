import { cn } from '@/lib/cn';

/*
 * Seletor de tamanho a partir das variacoes reais do produto
 * (PublicProductVariantDTO: variantId, size, stock, inStock).
 *
 * Tamanhos sem estoque continuam visiveis, mas riscados e nao
 * selecionaveis (input desabilitado). A validacao definitiva e do backend.
 *
 * compact: versao da barra fixa do celular — titulo so para leitor de tela e
 * os tamanhos numa linha que rola para o lado.
 */
export default function SizeSelector({ variants, value, onChange, className, compact = false }) {
  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend
        className={cn(
          'mb-2 text-xs font-semibold uppercase tracking-wider text-foreground',
          compact && 'sr-only',
        )}
      >
        Tamanho
      </legend>
      <div
        className={cn('flex gap-2', compact ? '-mx-1 overflow-x-auto px-1 pb-0.5' : 'flex-wrap')}
        role="radiogroup"
        aria-label="Tamanho"
      >
        {variants.map((variant) => {
          const disabled = !variant.inStock;
          const selected = value === variant.variantId;

          return (
            <label
              key={variant.variantId}
              className={cn(
                'flex min-w-12 shrink-0 cursor-pointer items-center justify-center rounded-control border px-3 py-2 text-sm transition-colors',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/40',
                selected
                  ? 'border-accent bg-accent text-accent-fg'
                  : 'border-border text-foreground hover:border-foreground/40',
                disabled &&
                  'cursor-not-allowed border-border text-muted line-through opacity-60 hover:border-border',
              )}
            >
              <input
                type="radio"
                name="size"
                value={variant.variantId}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(variant.variantId)}
                className="sr-only"
              />
              {variant.size}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
