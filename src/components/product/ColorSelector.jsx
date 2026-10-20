import ColorSwatch from '@/components/shared/ColorSwatch';
import { sameColor } from '@/lib/variants';

/*
 * Seletor de cor da Página de Produto: bolinha (cor escolhida no admin) ou
 * miniatura da foto da cor. Cores esgotadas continuam clicáveis (a cliente
 * vê as fotos), mas aparecem riscadas e o nome diz "esgotada".
 *
 * `colors`: [{ name, hex, image, inStock }] (ProductDTO.colors).
 */
export default function ColorSelector({ colors, value, onChange, className }) {
  const current = colors.find((c) => sameColor(c.name, value));

  return (
    <fieldset className={className}>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground">
        Cor:{' '}
        <span className="font-normal normal-case tracking-normal text-muted">
          {current ? current.name : 'selecione'}
          {current && !current.inStock && ' (esgotada)'}
        </span>
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {colors.map((color) => {
          const selected = sameColor(color.name, value);
          return (
            <button
              key={color.name}
              type="button"
              onClick={() => onChange(color.name)}
              aria-pressed={selected}
              aria-label={color.inStock ? `Cor ${color.name}` : `Cor ${color.name} (esgotada)`}
              title={color.name}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <ColorSwatch
                name={color.name}
                hex={color.hex}
                image={color.image}
                size="lg"
                selected={selected}
                soldOut={!color.inStock}
              />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
