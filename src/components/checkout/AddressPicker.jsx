import { useState } from 'react';
import { useDispatch } from 'react-redux';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/shared/EmptyState';
import AddressForm from '@/components/account/AddressForm';
import { saveAddress } from '@/features/address/addressSlice';
import { cn } from '@/lib/cn';

export default function AddressPicker({ addresses, value, onChange }) {
  const dispatch = useDispatch();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const saved = await dispatch(saveAddress({ addressId: null, data: values })).unwrap();
      setAdding(false);
      onChange(saved.addressId);
    } catch {
      // erro exibido a partir do slice
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="font-display text-xl text-foreground">Endereço de entrega</h2>

      {addresses.length === 0 && !adding && (
        <EmptyState
          title="Nenhum endereço cadastrado"
          description="Adicione um endereço para continuar."
        />
      )}

      {addresses.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <label
              key={address.addressId}
              className={cn(
                'cursor-pointer rounded-card border p-4 text-sm',
                value === address.addressId
                  ? 'border-accent ring-1 ring-accent'
                  : 'border-border hover:border-foreground/30',
              )}
            >
              <input
                type="radio"
                name="address"
                className="sr-only"
                checked={value === address.addressId}
                onChange={() => onChange(address.addressId)}
              />
              <p className="text-foreground">{address.street}</p>
              {address.buildingName && <p className="text-muted">{address.buildingName}</p>}
              <p className="mt-1 text-muted">
                {address.city} — {address.state}, {address.country}
              </p>
              <p className="text-muted">CEP {address.pincode}</p>
            </label>
          ))}
        </div>
      )}

      {adding ? (
        <div className="mt-5 rounded-card border border-border p-5">
          <AddressForm
            submitting={saving}
            onSubmit={handleSave}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : (
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => setAdding(true)}>
          Adicionar endereço
        </Button>
      )}
    </div>
  );
}
