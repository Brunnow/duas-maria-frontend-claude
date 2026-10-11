import { useState } from 'react';
import { FiArrowDown, FiArrowUp, FiTrash2 } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { HIGHLIGHT_ICONS, highlightText } from '@/lib/highlights';
import { saveHighlights } from '@/services/storeSettingsService';

const MAX_ITEMS = 4;
const MAX_TEXT = 60;

const toForm = (items = []) => items.map((item) => ({ ...item, text: item.text ?? '' }));

/* Faixa de benefícios abaixo da capa (tela "Avisos do site"). */
export default function HighlightsForm({ initial, onSaved }) {
  const [enabled, setEnabled] = useState(Boolean(initial?.highlightsEnabled));
  const [items, setItems] = useState(toForm(initial?.highlights));
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveOk, setSaveOk] = useState(false);

  const minAmount = initial?.freeShippingMinAmount ?? null;
  const hasFreeShippingItem = items.some((item) => item.kind === 'FREE_SHIPPING');

  const update = (index, patch) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    setFormError(null);
    setSaveOk(false);
  };

  const move = (index, delta) => {
    setItems((prev) => {
      const next = [...prev];
      const target = index + delta;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const add = () => setItems((prev) => [...prev, { kind: 'TEXT', icon: 'STAR', text: '' }]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (enabled && items.length === 0) {
      setFormError('Adicione pelo menos um item para mostrar a faixa.');
      return;
    }
    if (items.some((item) => item.kind === 'TEXT' && !item.text.trim())) {
      setFormError('Preencha o texto de todos os itens.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    setSaveError(null);
    setSaveOk(false);
    try {
      await saveHighlights({
        enabled,
        items: items.map((item) => ({
          kind: item.kind,
          icon: item.icon,
          text: item.kind === 'TEXT' ? item.text.trim() : null,
        })),
      });
      setSaveOk(true);
      onSaved?.();
    } catch (err) {
      setSaveError(err?.response?.data?.message || 'Não foi possível salvar a faixa.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-4">
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => {
            setEnabled(event.target.checked);
            setFormError(null);
          }}
        />
        Mostrar a faixa de benefícios no site
      </label>

      <ol className="space-y-3">
        {items.map((item, index) => {
          const freeShippingLabel = highlightText(item, minAmount);
          return (
            <li key={index} className="rounded-card border border-border p-3">
              <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
                <Select
                  label={`Ícone do item ${index + 1}`}
                  value={item.icon}
                  onChange={(event) => update(index, { icon: event.target.value })}
                >
                  {Object.entries(HIGHLIGHT_ICONS).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </Select>
                {item.kind === 'FREE_SHIPPING' ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted">
                      Texto do item {index + 1}
                    </span>
                    <p className="flex h-11 items-center rounded-control bg-subtle px-3 text-sm text-foreground">
                      {freeShippingLabel ||
                        'Frete grátis desativado: este item fica oculto no site.'}
                    </p>
                    <p className="text-xs text-muted">
                      Automático, usa o valor da tela “Frete grátis”.
                    </p>
                  </div>
                ) : (
                  <Input
                    label={`Texto do item ${index + 1}`}
                    maxLength={MAX_TEXT}
                    placeholder="Parcele em até 6x sem juros"
                    value={item.text}
                    onChange={(event) => update(index, { text: event.target.value })}
                  />
                )}
              </div>
              <div className="mt-2 flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Mover item ${index + 1} para cima`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <FiArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Mover item ${index + 1} para baixo`}
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <FiArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Remover item ${index + 1}`}
                  onClick={() => remove(index)}
                  className="text-danger"
                >
                  <FiTrash2 />
                </Button>
              </div>
            </li>
          );
        })}
      </ol>

      {items.length < MAX_ITEMS && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={add}>
            Adicionar item
          </Button>
          {!hasFreeShippingItem && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setItems((prev) => [...prev, { kind: 'FREE_SHIPPING', icon: 'GIFT', text: '' }])
              }
            >
              Adicionar item de frete grátis
            </Button>
          )}
        </div>
      )}

      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={submitting}>
          Salvar faixa
        </Button>
        {saveOk && (
          <p role="status" className="text-sm text-success">
            {enabled ? 'Faixa salva e visível no site.' : 'Faixa salva (oculta no site).'}
          </p>
        )}
        {saveError && (
          <p role="alert" className="text-sm text-danger">
            {saveError}
          </p>
        )}
      </div>
    </form>
  );
}
