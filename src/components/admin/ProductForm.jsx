import { useId, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import VariantGridInput from '@/components/admin/VariantGridInput';
import { toGridPayload } from '@/lib/variants';
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

function toForm(product) {
  return {
    productName: product?.productName ?? '',
    description: product?.description ?? '',
    price: product?.price != null ? String(product.price) : '',
    discount: product?.discount != null ? String(product.discount) : '0',
  };
}

/**
 * Formulario de produto (criar/editar). Na criacao pede a categoria;
 * a edicao nao troca de categoria (o backend nao expoe isso).
 */
export default function ProductForm({
  product,
  categories = [],
  onSubmit,
  onCancel,
  submitting,
  error,
}) {
  const formRef = useRef(null);
  const descriptionId = useId();
  const isEdit = Boolean(product?.productId);
  const [values, setValues] = useState(() => toForm(product));
  const [categoryId, setCategoryId] = useState('');
  const [variants, setVariants] = useState({}); // { [size]: stockString } — só na criação
  const [errors, setErrors] = useState({});

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
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // No celular o botão fica bem abaixo dos campos: leva até o primeiro erro,
      // senão parece que "nada aconteceu".
      requestAnimationFrame(() => {
        formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
      });
      return;
    }

    onSubmit({
      categoryId: isEdit ? undefined : Number(categoryId),
      product: {
        ...(isEdit ? { productId: product.productId } : {}),
        productName: values.productName.trim(),
        description: values.description.trim(),
        price,
        discount,
        specialPrice,
      },
      variants: isEdit ? undefined : toGridPayload(variants),
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

      {!isEdit && (
        <div className="sm:col-span-2">
          <Select
            label="Categoria"
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value);
              setErrors((prev) => ({ ...prev, categoryId: undefined }));
            }}
            aria-invalid={errors.categoryId ? true : undefined}
          >
            <option value="">Selecione…</option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.categoryName}
              </option>
            ))}
          </Select>
          {errors.categoryId && <p className="mt-1 text-xs text-danger">{errors.categoryId}</p>}
        </div>
      )}

      <p className="text-sm text-muted sm:col-span-2">
        Preço final: <span className="text-foreground">{formatCurrency(specialPrice)}</span>
      </p>

      {!isEdit && (
        <div className="sm:col-span-2">
          <VariantGridInput value={variants} onChange={setVariants} />
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger sm:col-span-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" loading={submitting}>
          {isEdit ? 'Salvar alterações' : 'Criar produto'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
