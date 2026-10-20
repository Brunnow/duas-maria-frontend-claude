import Input from '@/components/ui/Input';
import { SIZE_GROUPS, UNICO } from '@/lib/variants';

/*
 * Grade de tamanhos para a CRIAÇÃO de um produto: marcar tamanhos e
 * informar o estoque inicial de cada um. `value` é um objeto
 * { [size]: stockString }; só os tamanhos presentes estão marcados.
 *
 * Tamanhos agrupados em letras, numeração (jeans) e "Único". Regra do
 * "Único" (espelha o backend): nunca convive com nenhum outro tamanho.
 */
export default function VariantGridInput({
  value,
  onChange,
  legend = 'Tamanhos e estoque (opcional)',
}) {
  const selected = value || {};
  const sizes = Object.keys(selected);
  const hasUnico = sizes.includes(UNICO);
  const hasNumbered = sizes.some((s) => s !== UNICO);

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
      <legend className="text-xs font-medium uppercase tracking-wider text-muted">{legend}</legend>
      <p className="mt-1 text-xs text-muted">
        Marque os tamanhos e informe o estoque inicial. Você pode ajustar depois em “Tamanhos e
        estoque”.
      </p>

      {SIZE_GROUPS.map((group) => (
        <div key={group.label} className="mt-3">
          <p className="text-xs text-muted">{group.label}</p>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
            {group.sizes.map((size) => {
              const checked = size in selected;
              const disabled = (size === UNICO && hasNumbered) || (size !== UNICO && hasUnico);
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
        </div>
      ))}
    </fieldset>
  );
}
