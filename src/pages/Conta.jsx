import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import AddressCard from '@/components/account/AddressCard';
import AddressForm from '@/components/account/AddressForm';
import { logout, selectAuth } from '@/features/auth/authSlice';
import {
  fetchAddresses,
  removeAddress,
  saveAddress,
  selectAddressError,
  selectAddresses,
  selectAddressStatus,
} from '@/features/address/addressSlice';

/* Rota protegida (ver App.jsx). */
export default function Conta() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, roles } = useSelector(selectAuth);
  const addresses = useSelector(selectAddresses);
  const status = useSelector(selectAddressStatus);
  const error = useSelector(selectAddressError);

  const [editing, setEditing] = useState(null); // null | 'new' | addressId
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      await dispatch(
        saveAddress({ addressId: editing === 'new' ? null : editing, data: values }),
      ).unwrap();
      setEditing(null);
    } catch {
      // erro exibido a partir do slice
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (addressId) => {
    setRemovingId(addressId);
    try {
      await dispatch(removeAddress(addressId)).unwrap();
    } catch {
      // erro exibido a partir do slice
    } finally {
      setRemovingId(null);
    }
  };

  const editTarget =
    typeof editing === 'number' ? addresses.find((a) => a.addressId === editing) : null;

  return (
    <Container className="py-10 lg:py-14">
      <h1 className="font-display text-3xl text-foreground">Minha conta</h1>

      <section className="mt-8 rounded-card border border-border p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">Perfil</h2>
        <p className="mt-3 text-sm text-foreground">{user?.username}</p>
        {roles?.length > 0 && <p className="text-xs text-muted">{roles.join(', ')}</p>}
        <div className="mt-4 flex gap-3">
          <Button as={Link} to="/pedidos" variant="secondary" size="sm">
            Meus pedidos
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl text-foreground">Endereços</h2>
          {editing === null && (
            <Button size="sm" onClick={() => setEditing('new')}>
              Adicionar endereço
            </Button>
          )}
        </div>

        {editing !== null && (
          <div className="mt-5 rounded-card border border-border p-5">
            <AddressForm
              initial={editTarget}
              submitting={saving}
              onSubmit={handleSave}
              onCancel={() => setEditing(null)}
            />
          </div>
        )}

        <div className="mt-5">
          {status === 'loading' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          ) : status === 'error' ? (
            <ErrorState
              message={error}
              action={
                <Button variant="secondary" size="sm" onClick={() => dispatch(fetchAddresses())}>
                  Tentar novamente
                </Button>
              }
            />
          ) : addresses.length === 0 && editing === null ? (
            <EmptyState
              title="Nenhum endereço cadastrado"
              description="Adicione um endereço para agilizar suas compras."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {addresses.map((address) => (
                <AddressCard
                  key={address.addressId}
                  address={address}
                  removing={removingId === address.addressId}
                  onEdit={() => setEditing(address.addressId)}
                  onRemove={() => handleRemove(address.addressId)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </Container>
  );
}
