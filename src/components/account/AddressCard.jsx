import Button from '@/components/ui/Button';

export default function AddressCard({ address, onEdit, onRemove, removing = false }) {
  return (
    <div className="rounded-card border border-border p-4">
      <p className="text-sm text-foreground">{address.street}</p>
      {address.buildingName && <p className="text-sm text-muted">{address.buildingName}</p>}
      <p className="mt-1 text-sm text-muted">
        {address.city} — {address.state}, {address.country}
      </p>
      <p className="text-sm text-muted">CEP {address.pincode}</p>

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
