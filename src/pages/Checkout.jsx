import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import StepNav from '@/components/checkout/StepNav';
import AddressPicker from '@/components/checkout/AddressPicker';
import ShippingStep from '@/components/checkout/ShippingStep';
import CouponField from '@/components/checkout/CouponField';
import OrderReview from '@/components/checkout/OrderReview';
import { useFetch } from '@/hooks/useFetch';
import { selectCartItems } from '@/features/cart/cartSlice';
import { fetchAddresses, selectAddresses } from '@/features/address/addressSlice';
import { createOrder, startMercadoPagoPayment } from '@/services/orderService';
import { getShippingOptions } from '@/services/shippingService';
import { goToExternal } from '@/lib/navigate';

const STEPS = ['Endereço', 'Frete', 'Revisão'];

/*
 * Rota protegida (ver App.jsx). Ao confirmar, cria o pedido e redireciona ao
 * Checkout Pro do Mercado Pago — a escolha entre Pix/cartão/boleto acontece
 * lá, não aqui. A confirmação do pagamento chega pelo webhook; esta tela não
 * espera por ela (ver /checkout/retorno).
 */
export default function Checkout() {
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const addresses = useSelector(selectAddresses);

  const [step, setStep] = useState(0);
  const [addressId, setAddressId] = useState(null);
  const [shippingServiceId, setShippingServiceId] = useState(null);
  const [coupon, setCoupon] = useState(null); // { code, discountAmount } | null
  const [placing, setPlacing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState(null);
  const [shortage, setShortage] = useState(null);
  // Pedido criado mas a preference do Mercado Pago falhou na hora — fica aqui
  // até o cliente conseguir iniciar o pagamento (retry), em vez de perder o pedido.
  const [pendingOrder, setPendingOrder] = useState(null);

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  const selectedAddress = addresses.find((a) => a.addressId === addressId);
  const uf = selectedAddress?.state || null;
  const cep = selectedAddress?.pincode || null;

  // Cotação de frete pelo CEP/UF do endereço selecionado (Fase ME3). O
  // backend recota tudo de novo na criação do pedido; esta lista é só para o
  // cliente escolher a modalidade.
  const shippingFetcher = useCallback(() => {
    if (!cep || !uf) return Promise.resolve(null);
    return getShippingOptions({ cep, uf }).catch((err) => {
      const data = err?.response?.data;
      const msg =
        data?.cep ||
        data?.uf ||
        data?.message ||
        'Não foi possível calcular o frete para este endereço.';
      const normalized = new Error(msg);
      normalized.response = { data: { message: msg } };
      throw normalized;
    });
  }, [cep, uf]);
  const shipping = useFetch(shippingFetcher, [cep, uf]);

  // Pré-seleciona a primeira opção (mais barata, já que o backend devolve
  // nessa ordem) sempre que a escolha do cliente não estiver mais na lista
  // atual (primeira carga, ou endereço trocado e a opção escolhida sumiu).
  // Derivado no render, sem efeito: nada de corrida entre a cotação chegar e
  // o botão "Continuar" já refletir a seleção.
  const options = shipping.data || [];
  const effectiveShippingServiceId = options.some((o) => o.serviceId === shippingServiceId)
    ? shippingServiceId
    : (options[0]?.serviceId ?? null);
  const selectedShippingOption = options.find((o) => o.serviceId === effectiveShippingServiceId);

  // Carrinho vazio e nenhum pedido pendente de pagamento -> volta para o carrinho.
  if (!pendingOrder && items.length === 0) {
    return <Navigate to="/carrinho" replace />;
  }

  const handleRetryPayment = async () => {
    setRetrying(true);
    setError(null);
    try {
      const { initPoint } = await startMercadoPagoPayment(pendingOrder.orderId);
      goToExternal(initPoint);
    } catch {
      setError('Ainda não foi possível iniciar o pagamento. Tente novamente em instantes.');
    } finally {
      setRetrying(false);
    }
  };

  if (pendingOrder) {
    return (
      <Container className="py-10 lg:py-14">
        <div className="mx-auto max-w-lg text-center">
          <p className="font-display text-2xl text-foreground">Pedido criado</p>
          <p className="mt-2 text-sm text-muted">
            Pedido <span className="font-medium text-foreground">#{pendingOrder.orderId}</span>{' '}
            aguardando pagamento. Não conseguimos abrir o Mercado Pago agora, mas o pedido já está
            salvo.
          </p>
          {error && (
            <p role="alert" className="mt-4 text-sm text-danger">
              {error}
            </p>
          )}
          <Button onClick={handleRetryPayment} loading={retrying} className="mt-6">
            Iniciar pagamento
          </Button>
        </div>
      </Container>
    );
  }

  const shippingReady = shipping.status === 'ready' && selectedShippingOption != null;
  const canContinue =
    (step === 0 && addressId != null) || (step === 1 && shippingReady) || step === 2;

  const handleConfirm = async () => {
    setPlacing(true);
    setError(null);
    setShortage(null);
    try {
      const { order, initPoint, paymentInitFailed } = await createOrder({
        addressId,
        couponCode: coupon?.code,
        shippingServiceId: effectiveShippingServiceId,
      });
      if (paymentInitFailed || !initPoint) {
        setPendingOrder(order);
        setError('Pedido criado, mas não foi possível iniciar o pagamento agora.');
        return;
      }
      goToExternal(initPoint);
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 409 && Array.isArray(data?.unavailableItems)) {
        setShortage(data.unavailableItems);
      } else if (status === 400 || status === 404 || status === 409) {
        // inclui cupom recusado no fechamento (inválido -> 400, limite -> 409)
        setError(data?.message || 'Não foi possível finalizar o pedido.');
        if (data?.message?.includes('frete escolhido')) {
          // opção escolhida ficou indisponível entre a cotação e a confirmação
          // -> recota, para o cliente poder escolher de novo em vez de travar
          shipping.refetch();
        }
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
        {step === 1 && (
          <ShippingStep
            shipping={shipping}
            uf={uf}
            selectedServiceId={effectiveShippingServiceId}
            onSelect={setShippingServiceId}
            onRetry={shipping.refetch}
          />
        )}
        {step === 2 && (
          <>
            <OrderReview
              items={items}
              address={selectedAddress}
              shipping={selectedShippingOption}
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
        {step < 2 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
            Continuar
          </Button>
        ) : (
          <Button
            onClick={handleConfirm}
            loading={placing}
            disabled={addressId == null || !shippingReady}
          >
            Ir para o pagamento
          </Button>
        )}
      </div>
    </Container>
  );
}
