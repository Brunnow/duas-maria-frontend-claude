import { useId, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import NewProductColors from '@/components/admin/NewProductColors';
import PhotoPicker from '@/components/admin/PhotoPicker';
import VariantGridInput from '@/components/admin/VariantGridInput';
import { colorFieldsValue, colorPayload } from '@/lib/colors';
import { sameColor, toGridPayload } from '@/lib/variants';
import { computeSpecialPrice, formatCurrency, parseDecimal } from '@/lib/format';
import { cn } from '@/lib/cn';
import { maxLength, minLength, required, validateForm } from '@/lib/validation';

// Limites das colunas no backend (products.product_name / products.description).
const NAME_MAX = 255;
const DESCRIPTION_MAX = 2000;

const baseSchema = {
  productName: [
    required('Informe o nome'),
    minLength(3, 'Mínimo de 3 caracteres'),
    maxLength(NAME_MAX, `Máximo de ${NAME_MAX} caracteres`),
  ],
  description: [
    required('Informe a descrição'),
    minLength(6, 'Mínimo de 6 caracteres'),
    maxLength(DESCRIPTION_MAX, `Máximo de ${DESCRIPTION_MAX} caracteres`),
  ],
};

let blockSeq = 0;
const newColorBlock = (grid = {}, files = []) => ({
  key: `cor-${++blockSeq}`,
  color: colorFieldsValue(),
  grid,
  files,
});

/** Erros das cores: nome obrigatório e sem repetir, e ao menos um tamanho por cor. */
function validateColors(blocks) {
  const errors = {};
  blocks.forEach((block, index) => {
    const name = block.color.name.trim();
    const e = {};
    if (!name) e.name = 'Informe o nome da cor';
    else if (blocks.slice(0, index).some((b) => sameColor(b.color.name, name))) {
      e.name = 'Essa cor já está acima';
    }
    if (toGridPayload(block.grid).length === 0) e.grid = 'Marque ao menos um tamanho desta cor.';
    if (Object.keys(e).length) errors[block.key] = e;
  });
  return errors;
}

function toForm(product) {
  return {
    productName: product?.productName ?? '',
    description: product?.description ?? '',
    price: product?.price != null ? String(product.price) : '',
    discount: product?.discount != null ? String(product.discount) : '0',
  };
}

/**
 * Formulario de produto (criar/editar). Na criacao pede a categoria; na
 * edicao a categoria e opcional ("Manter a categoria atual") e, se escolhida,
 * o produto e movido por um endpoint proprio.
 *
 * Na criacao, tudo numa tela so: tamanhos e fotos (produto sem cor) ou um
 * bloco por cor com tamanhos e fotos. Quem cria tudo em sequencia e a pagina
 * (AdminProdutos); `progress` mostra a etapa em andamento.
 */
export default function ProductForm({
  product,
  categories = [],
  onSubmit,
  onCancel,
  submitting,
  error,
  progress,
}) {
  const formRef = useRef(null);
  const descriptionId = useId();
  const isEdit = Boolean(product?.productId);
  const [values, setValues] = useState(() => toForm(product));
  const [categoryId, setCategoryId] = useState('');
  const [variants, setVariants] = useState({}); // { [size]: stockString } — só na criação
  const [photos, setPhotos] = useState([]); // File[] — produto sem cor, só na criação
  const [mode, setMode] = useState('sizes'); // 'sizes' | 'colors' — só na criação
  const [colors, setColors] = useState(() => [newColorBlock()]);
  const [colorErrors, setColorErrors] = useState({});
  const [errors, setErrors] = useState({});

  // Passar para "com cores" leva o que já foi marcado (tamanhos e fotos) para a
  // primeira cor, se ela ainda estiver vazia — nada do que foi feito se perde.
  const chooseMode = (next) => {
    if (next === 'colors' && mode === 'sizes') {
      const [first, ...rest] = colors;
      const firstEmpty =
        !first.color.name.trim() && !Object.keys(first.grid).length && !first.files.length;
      if (firstEmpty && (Object.keys(variants).length || photos.length)) {
        setColors([{ ...first, grid: variants, files: photos }, ...rest]);
      }
    }
    setMode(next);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Texto livre (não type="number"): no iPhone em pt-BR o teclado digita
  // vírgula, e um input numérico pode devolver "" para "89,90" — o preço virava 0.
  const price = parseDecimal(values.price) || 0;
  const discount = Number(values.discount) || 0;
  const specialPrice = computeSpecialPrice(price, discount);

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = validateForm(values, baseSchema);
    if (price <= 0) found.price = 'Informe um preço válido';
    if (discount < 0 || discount > 90) found.discount = 'Desconto entre 0 e 90';
    if (!isEdit && !categoryId) found.categoryId = 'Escolha uma categoria';
    const foundColors = !isEdit && mode === 'colors' ? validateColors(colors) : {};
    setErrors(found);
    setColorErrors(foundColors);
    if (Object.keys(found).length > 0 || Object.keys(foundColors).length > 0) {
      // No celular o botão fica bem abaixo dos campos: leva até o primeiro erro,
      // senão parece que "nada aconteceu".
      requestAnimationFrame(() => {
        const field = formRef.current?.querySelector('[aria-invalid="true"], [role="alert"]');
        field?.focus?.();
        field?.scrollIntoView?.({ block: 'center' });
      });
      return;
    }

    onSubmit({
      categoryId: categoryId ? Number(categoryId) : undefined,
      product: {
        ...(isEdit ? { productId: product.productId } : {}),
        productName: values.productName.trim(),
        description: values.description.trim(),
        price,
        discount,
        specialPrice,
      },
      variants: isEdit || mode === 'colors' ? undefined : toGridPayload(variants),
      photos: isEdit || mode === 'colors' ? [] : photos,
      colors:
        isEdit || mode !== 'colors'
          ? []
          : colors.map((block) => ({
              ...colorPayload(block.color),
              grid: toGridPayload(block.grid),
              files: block.files,
            })),
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Input
          label="Nome"
          name="productName"
          value={values.productName}
          onChange={handleChange}
          error={errors.productName}
        />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label
          htmlFor={descriptionId}
          className="text-xs font-medium uppercase tracking-wider text-muted"
        >
          Descrição
        </label>
        <textarea
          id={descriptionId}
          name="description"
          rows={5}
          value={values.description}
          onChange={handleChange}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={`${descriptionId}-help`}
          className={cn(
            'w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
            errors.description && 'border-danger focus-visible:ring-danger/30',
          )}
        />
        <div id={`${descriptionId}-help`} className="flex justify-between gap-3 text-xs">
          <span className="text-danger">{errors.description}</span>
          <span
            className={cn(
              'shrink-0 tabular-nums',
              values.description.length > DESCRIPTION_MAX ? 'text-danger' : 'text-muted',
            )}
          >
            {values.description.length} / {DESCRIPTION_MAX}
          </span>
        </div>
      </div>

      <Input
        label="Preço (R$)"
        name="price"
        inputMode="decimal"
        placeholder="Ex.: 89,90"
        value={values.price}
        onChange={handleChange}
        error={errors.price}
      />
      <Input
        label="Desconto (%)"
        name="discount"
        type="number"
        step="1"
        min="0"
        max="90"
        value={values.discount}
        onChange={handleChange}
        error={errors.discount}
      />

      <div className="sm:col-span-2">
        <Select
          label={isEdit ? 'Mudar categoria' : 'Categoria'}
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            setErrors((prev) => ({ ...prev, categoryId: undefined }));
          }}
          aria-invalid={errors.categoryId ? true : undefined}
        >
          <option value="">{isEdit ? 'Manter a categoria atual' : 'Selecione…'}</option>
          {categories.map((c) => (
            <option key={c.categoryId} value={c.categoryId}>
              {c.categoryName}
            </option>
          ))}
        </Select>
        {errors.categoryId && <p className="mt-1 text-xs text-danger">{errors.categoryId}</p>}
      </div>

      <p className="text-sm text-muted sm:col-span-2">
        Preço final: <span className="text-foreground">{formatCurrency(specialPrice)}</span>
      </p>

      {!isEdit && (
        <fieldset className="flex flex-col gap-4 border-t border-border pt-5 sm:col-span-2">
          <legend className="sr-only">Variações</legend>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-foreground">Variações e fotos</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="variation-mode"
                  checked={mode === 'sizes'}
                  onChange={() => chooseMode('sizes')}
                />
                Só tamanhos (sem cores)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="variation-mode"
                  checked={mode === 'colors'}
                  onChange={() => chooseMode('colors')}
                />
                Com cores
              </label>
            </div>
          </div>

          {mode === 'sizes' ? (
            <>
              <VariantGridInput value={variants} onChange={setVariants} />
              <PhotoPicker files={photos} onChange={setPhotos} />
            </>
          ) : (
            <>
              <NewProductColors value={colors} onChange={setColors} errors={colorErrors} />
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setColors((prev) => [...prev, newColorBlock()])}
                >
                  + Adicionar outra cor
                </Button>
              </div>
            </>
          )}
        </fieldset>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger sm:col-span-2">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" loading={submitting}>
          {isEdit ? 'Salvar alterações' : 'Criar produto'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        {submitting && progress && (
          <p role="status" aria-live="polite" className="text-sm text-muted">
            {progress}
          </p>
        )}
      </div>
    </form>
  );
}
