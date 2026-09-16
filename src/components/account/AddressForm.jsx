import { useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { pattern, required, validateForm } from '@/lib/validation';
import { UFS, cepDigits, formatCep, formatCpf } from '@/lib/br';
import { lookupCep } from '@/services/viaCep';

const CEP_RE = /^\d{5}-?\d{3}$/;
const PHONE_RE = /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/;
const CPF_RE = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;

// Espelha o AddressDTO do backend. `country` não entra: o backend assume "Brasil".
const FIELD_KEYS = [
  'recipientName',
  'phone',
  'document',
  'pincode',
  'street',
  'number',
  'buildingName',
  'neighborhood',
  'city',
  'state',
];

const EMPTY = Object.fromEntries(FIELD_KEYS.map((k) => [k, '']));

const schema = {
  recipientName: [required('Informe quem vai receber')],
  phone: [required('Informe um telefone'), pattern(PHONE_RE, 'Telefone inválido')],
  document: [required('Informe o CPF de quem vai receber'), pattern(CPF_RE, 'CPF inválido')],
  pincode: [required('Informe o CEP'), pattern(CEP_RE, 'CEP inválido (ex.: 50000-000)')],
  street: [required('Informe o logradouro')],
  number: [required('Informe o número (use "s/n" se não houver)')],
  neighborhood: [required('Informe o bairro')],
  city: [required('Informe a cidade')],
  state: [required('Informe a UF')],
};

function pickFields(address) {
  if (!address) return {};
  const picked = FIELD_KEYS.reduce((acc, k) => ({ ...acc, [k]: address[k] ?? '' }), {});
  if (picked.pincode) picked.pincode = formatCep(picked.pincode);
  if (picked.document) picked.document = formatCpf(picked.document);
  return picked;
}

export default function AddressForm({ initial, onSubmit, onCancel, submitting = false }) {
  const [values, setValues] = useState(() => ({ ...EMPTY, ...pickFields(initial) }));
  const [errors, setErrors] = useState({});
  const [cepStatus, setCepStatus] = useState(null); // null | 'loading' | 'notFound' | 'network'
  const lastCep = useRef('');

  const setField = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleChange = (event) => setField(event.target.name, event.target.value);

  const handleDocumentChange = (event) => setField('document', formatCpf(event.target.value));

  const handleCepChange = async (event) => {
    const formatted = formatCep(event.target.value);
    setField('pincode', formatted);

    const digits = cepDigits(formatted);
    if (digits.length !== 8 || digits === lastCep.current) return;
    lastCep.current = digits;
    setCepStatus('loading');
    try {
      const found = await lookupCep(digits);
      setCepStatus(null);
      // Só sobrescreve com o que o ViaCEP devolveu preenchido; o resto o
      // usuário completa/edita à mão.
      setValues((prev) => ({
        ...prev,
        street: found.street || prev.street,
        neighborhood: found.neighborhood || prev.neighborhood,
        city: found.city || prev.city,
        state: found.state || prev.state,
      }));
      setErrors((prev) => ({
        ...prev,
        street: undefined,
        neighborhood: undefined,
        city: undefined,
        state: undefined,
      }));
    } catch (err) {
      setCepStatus(err?.kind === 'notFound' ? 'notFound' : 'network');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = validateForm(values, schema);
    setErrors(found);
    if (Object.keys(found).length === 0) onSubmit({ ...values });
  };

  const cepHint =
    cepStatus === 'loading'
      ? 'Buscando endereço…'
      : cepStatus === 'notFound'
        ? 'CEP não encontrado. Preencha os campos manualmente.'
        : cepStatus === 'network'
          ? 'Não foi possível buscar o CEP agora. Preencha manualmente.'
          : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Input
          label="Nome de quem vai receber"
          name="recipientName"
          value={values.recipientName}
          onChange={handleChange}
          error={errors.recipientName}
        />
      </div>
      <Input
        label="Telefone"
        name="phone"
        inputMode="tel"
        placeholder="(81) 91234-5678"
        value={values.phone}
        onChange={handleChange}
        error={errors.phone}
      />
      <Input
        label="CEP"
        name="pincode"
        inputMode="numeric"
        placeholder="50000-000"
        value={values.pincode}
        onChange={handleCepChange}
        error={errors.pincode}
        hint={cepHint}
      />
      <div className="sm:col-span-2">
        <Input
          label="Logradouro"
          name="street"
          value={values.street}
          onChange={handleChange}
          error={errors.street}
        />
      </div>
      <Input
        label="Número"
        name="number"
        value={values.number}
        onChange={handleChange}
        error={errors.number}
      />
      <Input
        label="CPF de quem vai receber"
        name="document"
        inputMode="numeric"
        placeholder="123.456.789-01"
        value={values.document}
        onChange={handleDocumentChange}
        error={errors.document}
      />
      <Input
        label="Complemento"
        name="buildingName"
        placeholder="Opcional"
        value={values.buildingName}
        onChange={handleChange}
        error={errors.buildingName}
      />
      <Input
        label="Bairro"
        name="neighborhood"
        value={values.neighborhood}
        onChange={handleChange}
        error={errors.neighborhood}
      />
      <Input
        label="Cidade"
        name="city"
        value={values.city}
        onChange={handleChange}
        error={errors.city}
      />
      <div>
        <Select label="UF" name="state" value={values.state} onChange={handleChange}>
          <option value="">—</option>
          {UFS.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </Select>
        {errors.state && <p className="mt-1 text-xs text-danger">{errors.state}</p>}
      </div>

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
