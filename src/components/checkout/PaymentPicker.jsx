import { cn } from '@/lib/cn';
import { PAYMENT_METHODS } from './paymentMethods';

export default function PaymentPicker({ value, onChange }) {
  return (
    <div>
      <h2 className="font-display text-xl text-foreground">Forma de pagamento</h2>
      <p className="mt-1 text-xs text-muted">Pagamento simulado — nenhuma cobrança é feita.</p>

      <div className="mt-4 flex flex-col gap-3" role="radiogroup" aria-label="Forma de pagamento">
        {PAYMENT_METHODS.map((method) => (
          <label
            key={method.value}
            className={cn(
              'flex cursor-pointer items-center justify-between rounded-card border p-4 text-sm',
              value === method.value
                ? 'border-accent ring-1 ring-accent'
                : 'border-border hover:border-foreground/30',
            )}
          >
            <span>
              <span className="block text-foreground">{method.label}</span>
              <span className="text-xs text-muted">{method.hint}</span>
            </span>
            <input
              type="radio"
              name="payment"
              className="sr-only"
              checked={value === method.value}
              onChange={() => onChange(method.value)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
