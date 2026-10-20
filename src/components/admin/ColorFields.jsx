import { useId } from 'react';
import Input from '@/components/ui/Input';
import ColorSwatch from '@/components/shared/ColorSwatch';
import { COLOR_NAME_MAX } from '@/lib/colors';

/**
 * Nome da cor + como ela aparece na loja: bolinha (cor do seletor) ou a
 * miniatura da foto da cor (melhor para estampas). Componente controlado.
 */
export default function ColorFields({ label = 'Nome da cor', value, onChange, error }) {
  const id = useId();
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-3">
      <Input
        label={label}
        value={value.name}
        maxLength={COLOR_NAME_MAX}
        placeholder="Ex.: Verde, Preto, Floral azul"
        onChange={(e) => set({ name: e.target.value })}
        error={error}
      />
      <fieldset>
        <legend className="text-xs font-medium uppercase tracking-wider text-muted">
          Como aparece na loja
        </legend>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-foreground">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`${id}-mode`}
              checked={value.mode === 'hex'}
              onChange={() => set({ mode: 'hex' })}
            />
            Bolinha de cor
          </label>
          {value.mode === 'hex' && (
            <label className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Cor da bolinha"
                value={value.hex}
                onChange={(e) => set({ hex: e.target.value.toUpperCase() })}
                className="h-8 w-10 cursor-pointer rounded border border-border bg-surface p-0.5"
              />
              <ColorSwatch name={value.name} hex={value.hex} size="sm" />
            </label>
          )}
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`${id}-mode`}
              checked={value.mode === 'photo'}
              onChange={() => set({ mode: 'photo' })}
            />
            Miniatura da foto (estampas)
          </label>
        </div>
      </fieldset>
    </div>
  );
}
