import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import VariantGridInput from '@/components/admin/VariantGridInput';
import { toGridPayload } from '@/lib/variants';
import { computeSpecialPrice, formatCurrency } from '@/lib/format';
import { minLength, required, validateForm } from '@/lib/validation';

const baseSchema = {
  productName: [required('Informe o nome'), minLength(3, 'Mínimo de 3 caracteres')],
  description: [required('Informe a descrição'), minLength(6, 'Mínimo de 6 caracteres')],
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
export default function ProductForm({ product, categories = [], onSubmit, onCancel, submitting }) {
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

  const price = Number(values.price) || 0;
  const discount = Number(values.discount) || 0;
  const specialPrice = computeSpecialPrice(price, discount);

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = validateForm(values, baseSchema);
    if (price <= 0) found.price = 'Informe um preço válido';
    if (discount < 0 || discount > 90) found.discount = 'Desconto entre 0 e 90';
    if (!isEdit && !categoryId) found.categoryId = 'Escolha uma categoria';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

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
    <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Input
          label="Nome"
          name="productName"
          value={values.productName}
          onChange={handleChange}
          error={errors.productName}
        />
      </div>
      <div className="sm:col-span-2">
        <Input
          label="Descrição"
          name="description"
          value={values.description}
          onChange={handleChange}
          error={errors.description}
        />
      </div>

      <Input
        label="Preço (R$)"
        name="price"
        type="number"
        step="0.01"
        min="0"
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
            onChange={(event) => setCategoryId(event.target.value)}
            error={errors.categoryId}
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
