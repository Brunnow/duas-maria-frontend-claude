import Button from '@/components/ui/Button';
import { addressLines } from '@/lib/address';

export default function AddressCard({ address, onEdit, onRemove, removing = false }) {
  const [first, ...rest] = addressLines(address);

  return (
    <div className="rounded-card border border-border p-4">
      <p className="text-sm text-foreground">{first}</p>
      {rest.map((line) => (
        <p key={line} className="text-sm text-muted">
          {line}
        </p>
      ))}

      <div className="mt-3 flex gap-2">
        <Button variant="secondary" size="sm" onClick={onEdit}>
          Editar
        </Button>
        <Button variant="ghost" size="sm" onClick={onRemove} loading={removing}>
          Remover
        </Button>
      </div>
    </div>
  );
}
