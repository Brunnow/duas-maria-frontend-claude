import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import StepNav from '@/components/checkout/StepNav';
import AddressPicker from '@/components/checkout/AddressPicker';
import PaymentPicker from '@/components/checkout/PaymentPicker';
import OrderReview from '@/components/checkout/OrderReview';
import OrderConfirmation from '@/components/checkout/OrderConfirmation';
import { clearCart, selectCartItems } from '@/features/cart/cartSlice';
import { fetchAddresses, selectAddresses } from '@/features/address/addressSlice';
import { placeOrder } from '@/services/orderService';

const STEPS = ['Endereço', 'Pagamento', 'Revisão'];

/* Rota protegida (ver App.jsx). */
export default function Checkout() {
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const addresses = useSelector(selectAddresses);

  const [step, setStep] = useState(0);
  const [addressId, setAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);
  const [shortage, setShortage] = useState(null);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  // Carrinho vazio e pedido ainda nao finalizado -> volta para o carrinho.
  if (!order && items.length === 0) {
    return <Navigate to="/carrinho" replace />;
  }

  if (order) {
    return (
      <Container className="py-10 lg:py-14">
        <OrderConfirmation order={order} />
      </Container>
    );
  }

  const canContinue =
    (step === 0 && addressId != null) || (step === 1 && paymentMethod != null) || step === 2;

  const handleConfirm = async () => {
    setPlacing(true);
    setError(null);
    setShortage(null);
    try {
      const dto = await placeOrder({ addressId, paymentMethod });
      dispatch(clearCart());
      setOrder(dto);
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 409 && Array.isArray(data?.unavailableItems)) {
        setShortage(data.unavailableItems);
      } else if (status === 400 || status === 404) {
        setError(data?.message || 'Não foi possível finalizar o pedido.');
      } else {
        setError('Não foi possível finalizar o pedido. Tente novamente.');
      }
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Container className="py-10 lg:py-14">
      <h1 className="font-display text-3xl text-foreground">Checkout</h1>
      <StepNav steps={STEPS} current={step} className="mt-6" />

      <div className="mt-8">
        {step === 0 && (
          <AddressPicker addresses={addresses} value={addressId} onChange={setAddressId} />
        )}
        {step === 1 && <PaymentPicker value={paymentMethod} onChange={setPaymentMethod} />}
        {step === 2 && (
          <OrderReview
            items={items}
            address={addresses.find((a) => a.addressId === addressId)}
            paymentMethod={paymentMethod}
          />
        )}
      </div>

      {shortage && (
        <div
          role="alert"
          className="mt-6 rounded-card border border-danger/30 bg-danger/5 p-4 text-sm"
        >
          <p className="font-medium text-danger">Alguns itens ficaram sem estoque suficiente:</p>
          <ul className="mt-2 list-disc pl-5 text-muted">
            {shortage.map((item) => (
              <li key={item.variantId}>
                {item.productName} ({item.size}) — pedido {item.requested}, disponível{' '}
                {item.available}
              </li>
            ))}
          </ul>
          <Button as={Link} to="/carrinho" variant="secondary" size="sm" className="mt-3">
            Revisar carrinho
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-6 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-8 flex justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || placing}
        >
          Voltar
        </Button>
        {step < 2 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
            Continuar
          </Button>
        ) : (
          <Button
            onClick={handleConfirm}
            loading={placing}
            disabled={addressId == null || !paymentMethod}
          >
            Confirmar pedido
          </Button>
        )}
      </div>
    </Container>
  );
}
