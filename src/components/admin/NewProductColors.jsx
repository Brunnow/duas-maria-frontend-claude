import Button from '@/components/ui/Button';
import ColorFields from '@/components/admin/ColorFields';
import PhotoPicker from '@/components/admin/PhotoPicker';
import VariantGridInput from '@/components/admin/VariantGridInput';

/*
 * Cores do produto NOVO, cada uma com nome/bolinha, tamanhos e fotos. Nada vai
 * para a API aqui: o "Criar produto" cria tudo em sequência. Errou uma cor?
 * "Remover esta cor" antes de salvar — sem estoque para zerar nem nada a apagar.
 *
 * `value`: [{ key, color: { name, mode, hex }, grid: { [size]: stock }, files: File[] }]
 */
export default function NewProductColors({ value, onChange, errors = {} }) {
  const update = (key, patch) =>
    onChange(value.map((block) => (block.key === key ? { ...block, ...patch } : block)));
  const remove = (key) => onChange(value.filter((block) => block.key !== key));

  return (
    <div className="flex flex-col gap-4">
      {value.map((block, index) => (
        <section
          key={block.key}
          aria-label={`Cor ${index + 1}`}
          className="flex flex-col gap-4 rounded-card border border-border p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">
              Cor {index + 1}
              {block.color.name.trim() && (
                <span className="font-normal text-muted"> · {block.color.name.trim()}</span>
              )}
            </p>
            {value.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(block.key)}
                aria-label={`Remover a cor ${index + 1}`}
              >
                Remover esta cor
              </Button>
            )}
          </div>

          <ColorFields
            value={block.color}
            onChange={(color) => update(block.key, { color })}
            error={errors[block.key]?.name}
          />

          <div>
            <VariantGridInput
              value={block.grid}
              onChange={(grid) => update(block.key, { grid })}
              legend="Tamanhos e estoque desta cor"
            />
            {errors[block.key]?.grid && (
              <p role="alert" className="mt-2 text-sm text-danger">
                {errors[block.key].grid}
              </p>
            )}
          </div>

          <PhotoPicker
            label="Fotos desta cor"
            files={block.files}
            onChange={(files) => update(block.key, { files })}
            markFirst={index === 0}
          />
        </section>
      ))}
    </div>
  );
}
