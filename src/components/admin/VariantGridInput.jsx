import Input from '@/components/ui/Input';
import { VARIANT_SIZES } from '@/lib/variants';

/*
 * Grade de tamanhos para a CRIAÇÃO de um produto: marcar tamanhos e
 * informar o estoque inicial de cada um. `value` é um objeto
 * { [size]: stockString }; só os tamanhos presentes estão marcados.
 *
 * Regra do "Único" (espelha o backend): "Único" nunca convive com PP/P/M/G/GG.
 */
export default function VariantGridInput({ value, onChange }) {
  const selected = value || {};
  const sizes = Object.keys(selected);
  const hasUnico = sizes.includes('Único');
  const hasNumbered = sizes.some((s) => s !== 'Único');

  const toggle = (size) => {
    const next = { ...selected };
    if (size in next) {
      delete next[size];
    } else {
      next[size] = '0';
    }
    onChange(next);
  };

  const setStock = (size, stock) => onChange({ ...selected, [size]: stock });

  return (
    <fieldset>
      <legend className="text-xs font-medium uppercase tracking-wider text-muted">
        Tamanhos e estoque (opcional)
      </legend>
      <p className="mt-1 text-xs text-muted">
        Marque os tamanhos e informe o estoque inicial. Você pode ajustar depois em “Tamanhos e
        estoque”.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {VARIANT_SIZES.map((size) => {
          const checked = size in selected;
          const disabled = (size === 'Único' && hasNumbered) || (size !== 'Único' && hasUnico);
          return (
            <div
              key={size}
              className="flex items-center gap-3 rounded-control border border-border px-3 py-2"
            >
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(size)}
                  aria-label={`Tamanho ${size}`}
                />
                {size}
              </label>
              {checked && (
                <div className="ml-auto w-24">
                  <Input
                    aria-label={`Estoque inicial ${size}`}
                    type="number"
                    min="0"
                    value={selected[size]}
                    onChange={(e) => setStock(size, e.target.value)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
