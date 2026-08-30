import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { minLength, required, validateForm } from '@/lib/validation';

// Campos e minimos espelhando o Address do backend.
const FIELDS = [
  { name: 'street', label: 'Rua', min: 5, wide: true },
  { name: 'buildingName', label: 'Complemento / Número', min: 5, wide: true },
  { name: 'city', label: 'Cidade', min: 4 },
  { name: 'state', label: 'Estado', min: 2 },
  { name: 'country', label: 'País', min: 2 },
  { name: 'pincode', label: 'CEP', min: 5 },
];

const schema = Object.fromEntries(
  FIELDS.map((f) => [
    f.name,
    [required('Campo obrigatório'), minLength(f.min, `Mínimo de ${f.min} caracteres`)],
  ]),
);

const EMPTY = Object.fromEntries(FIELDS.map((f) => [f.name, '']));

function pickFields(address) {
  if (!address) return {};
  return FIELDS.reduce((acc, f) => ({ ...acc, [f.name]: address[f.name] ?? '' }), {});
}

export default function AddressForm({ initial, onSubmit, onCancel, submitting = false }) {
  const [values, setValues] = useState(() => ({ ...EMPTY, ...pickFields(initial) }));
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = validateForm(values, schema);
    setErrors(found);
    if (Object.keys(found).length === 0) onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      {FIELDS.map((field) => (
        <div key={field.name} className={field.wide ? 'sm:col-span-2' : undefined}>
          <Input
            label={field.label}
            name={field.name}
            value={values[field.name]}
            onChange={handleChange}
            error={errors[field.name]}
          />
        </div>
      ))}
      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" loading={submitting}>
          Salvar endereço
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
