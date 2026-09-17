import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import ErrorState from '@/components/shared/ErrorState';
import { useFetch } from '@/hooks/useFetch';
import { getSenderConfig, saveSenderConfig } from '@/services/shippingSenderConfigService';
import { pattern, required, validateForm } from '@/lib/validation';
import { UFS, cepDigits, cnpjDigits, cpfDigits, formatCep, formatCnpj, formatCpf } from '@/lib/br';

const CEP_RE = /^\d{5}-?\d{3}$/;
const UF_RE = /^[A-Z]{2}$/;

// Espelha o ShippingSenderConfigDTO do backend.
const FIELD_KEYS = [
  'name',
  'document',
  'companyDocument',
  'stateRegister',
  'address',
  'number',
  'complement',
  'district',
  'city',
  'stateAbbr',
  'postalCode',
  'phone',
  'email',
];

const EMPTY = Object.fromEntries(FIELD_KEYS.map((k) => [k, '']));

const schema = {
  name: [required('Informe o nome do remetente')],
  address: [required('Informe o endereço')],
  number: [required('Informe o número')],
  district: [required('Informe o bairro')],
  city: [required('Informe a cidade')],
  stateAbbr: [required('Informe a UF'), pattern(UF_RE, 'UF inválida')],
  postalCode: [required('Informe o CEP'), pattern(CEP_RE, 'CEP inválido (ex.: 50000-000)')],
};

function pickFields(config) {
  if (!config) return {};
  const picked = FIELD_KEYS.reduce((acc, k) => ({ ...acc, [k]: config[k] ?? '' }), {});
  if (picked.postalCode) picked.postalCode = formatCep(picked.postalCode);
  if (picked.document) picked.document = formatCpf(picked.document);
  if (picked.companyDocument) picked.companyDocument = formatCnpj(picked.companyDocument);
  return picked;
}

export default function AdminConfigRemetente() {
  const { status, data, error, refetch } = useFetch(getSenderConfig, []);

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveOk, setSaveOk] = useState(false);

  // Preenche o formulario assim que os dados chegam pela primeira vez — so
  // uma vez, pra um refetch (ex.: apos salvar) nao sobrescrever o que o
  // admin esteja digitando. Ajusta durante a renderizacao (nao em efeito),
  // mesmo padrao usado no reset de estado do AdminPedidoDetalhe.
  const [loadedOnce, setLoadedOnce] = useState(false);
  if (status === 'ready' && !loadedOnce) {
    setLoadedOnce(true);
    setValues({ ...EMPTY, ...pickFields(data) });
  }

  const setField = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleChange = (event) => setField(event.target.name, event.target.value);
  const handleCepChange = (event) => setField('postalCode', formatCep(event.target.value));
  const handleCpfChange = (event) => setField('document', formatCpf(event.target.value));
  const handleCnpjChange = (event) => setField('companyDocument', formatCnpj(event.target.value));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateForm(values, schema);
    if (!values.document.trim() && !values.companyDocument.trim()) {
      found.document = 'Informe o CPF ou o CNPJ do remetente.';
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setSaveError(null);
    setSaveOk(false);
    try {
      const payload = {
        ...values,
        document: values.document.trim() ? cpfDigits(values.document) : null,
        companyDocument: values.companyDocument.trim() ? cnpjDigits(values.companyDocument) : null,
        postalCode: cepDigits(values.postalCode),
      };
      await saveSenderConfig(payload);
      setSaveOk(true);
      refetch();
    } catch (err) {
      setSaveError(
        err?.response?.data?.message || 'Não foi possível salvar os dados do remetente.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="font-display text-xl text-foreground">Remetente</h2>
      <p className="mt-1 text-sm text-muted">
        Dados da loja usados pra comprar frete no Melhor Envio. Sem isso preenchido, a compra de
        etiqueta fica bloqueada.
      </p>

      {status === 'loading' ? (
        <Skeleton className="mt-6 h-64" />
      ) : status === 'error' ? (
        <ErrorState
          className="mt-6"
          message={error}
          action={
            <Button variant="secondary" size="sm" onClick={refetch}>
              Tentar novamente
            </Button>
          }
        />
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Nome do remetente"
              name="name"
              value={values.name}
              onChange={handleChange}
              error={errors.name}
            />
          </div>
          <Input
            label="CPF"
            name="document"
            inputMode="numeric"
            placeholder="123.456.789-01"
            value={values.document}
            onChange={handleCpfChange}
            error={errors.document}
            hint="Informe o CPF ou o CNPJ"
          />
          <Input
            label="CNPJ"
            name="companyDocument"
            inputMode="numeric"
            placeholder="12.345.678/0001-99"
            value={values.companyDocument}
            onChange={handleCnpjChange}
          />
          <Input
            label="Inscrição estadual"
            name="stateRegister"
            placeholder="ISENTO"
            value={values.stateRegister}
            onChange={handleChange}
            hint='Deixe "ISENTO" se o envio não for comercial'
          />
          <div className="sm:col-span-2">
            <Input
              label="Endereço"
              name="address"
              value={values.address}
              onChange={handleChange}
              error={errors.address}
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
            label="Complemento"
            name="complement"
            placeholder="Opcional"
            value={values.complement}
            onChange={handleChange}
          />
          <Input
            label="Bairro"
            name="district"
            value={values.district}
            onChange={handleChange}
            error={errors.district}
          />
          <Input
            label="Cidade"
            name="city"
            value={values.city}
            onChange={handleChange}
            error={errors.city}
          />
          <div>
            <Select label="UF" name="stateAbbr" value={values.stateAbbr} onChange={handleChange}>
              <option value="">—</option>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </Select>
            {errors.stateAbbr && <p className="mt-1 text-xs text-danger">{errors.stateAbbr}</p>}
          </div>
          <Input
            label="CEP"
            name="postalCode"
            inputMode="numeric"
            placeholder="50000-000"
            value={values.postalCode}
            onChange={handleCepChange}
            error={errors.postalCode}
          />
          <Input
            label="Telefone"
            name="phone"
            inputMode="tel"
            placeholder="(81) 91234-5678"
            value={values.phone}
            onChange={handleChange}
          />
          <Input
            label="E-mail"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
          />

          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit" loading={submitting}>
              Salvar
            </Button>
            {saveOk && (
              <p role="status" className="text-sm text-success">
                Dados salvos.
              </p>
            )}
            {saveError && (
              <p role="alert" className="text-sm text-danger">
                {saveError}
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
