import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import StepNav from '@/components/checkout/StepNav';
import AddressPicker from '@/components/checkout/AddressPicker';
import ShippingStep from '@/components/checkout/ShippingStep';
import PaymentPicker from '@/components/checkout/PaymentPicker';
import CouponField from '@/components/checkout/CouponField';
import OrderReview from '@/components/checkout/OrderReview';
import OrderConfirmation from '@/components/checkout/OrderConfirmation';
import { useFetch } from '@/hooks/useFetch';
import { clearCart, selectCartItems } from '@/features/cart/cartSlice';
import { fetchAddresses, selectAddresses } from '@/features/address/addressSlice';
import { placeOrder } from '@/services/orderService';
import { quoteShipping } from '@/services/shippingService';

const STEPS = ['Endereço', 'Frete', 'Pagamento', 'Revisão'];

/* Rota protegida (ver App.jsx). */
export default function Checkout() {
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const addresses = useSelector(selectAddresses);

  const [step, setStep] = useState(0);
  const [addressId, setAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [coupon, setCoupon] = useState(null); // { code, discountAmount } | null
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);
  const [shortage, setShortage] = useState(null);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  const selectedAddress = addresses.find((a) => a.addressId === addressId);
  const uf = selectedAddress?.state || null;

  // Cotação de frete pela UF do endereço selecionado. O backend recalcula
  // na criação do pedido; este valor é informativo para a revisão.
  const shippingFetcher = useCallback(() => {
    if (!uf) return Promise.resolve(null);
    return quoteShipping(uf).catch((err) => {
      const data = err?.response?.data;
      const msg =
        data?.uf || data?.message || 'Não foi possível calcular o frete para este endereço.';
      const normalized = new Error(msg);
      normalized.response = { data: { message: msg } };
      throw normalized;
    });
  }, [uf]);
  const shipping = useFetch(shippingFetcher, [uf]);

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

  const shippingReady = shipping.status === 'ready' && shipping.data != null;
  const canContinue =
    (step === 0 && addressId != null) ||
    (step === 1 && shippingReady) ||
    (step === 2 && paymentMethod != null) ||
    step === 3;

  const handleConfirm = async () => {
    setPlacing(true);
    setError(null);
    setShortage(null);
    try {
      const dto = await placeOrder({ addressId, paymentMethod, couponCode: coupon?.code });
      dispatch(clearCart());
      setOrder(dto);
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 409 && Array.isArray(data?.unavailableItems)) {
        setShortage(data.unavailableItems);
      } else if (status === 400 || status === 404 || status === 409) {
        // inclui cupom recusado no fechamento (inválido -> 400, limite -> 409)
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
        {step === 1 && <ShippingStep shipping={shipping} uf={uf} onRetry={shipping.refetch} />}
        {step === 2 && <PaymentPicker value={paymentMethod} onChange={setPaymentMethod} />}
        {step === 3 && (
          <>
            <OrderReview
              items={items}
              address={selectedAddress}
              paymentMethod={paymentMethod}
              shipping={shipping.data}
              coupon={coupon}
            />
            <CouponField value={coupon} onApply={setCoupon} onRemove={() => setCoupon(null)} />
          </>
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
        {step < 3 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
            Continuar
          </Button>
        ) : (
          <Button
            onClick={handleConfirm}
            loading={placing}
            disabled={addressId == null || !paymentMethod || !shippingReady}
          >
            Confirmar pedido
          </Button>
        )}
      </div>
    </Container>
  );
}
