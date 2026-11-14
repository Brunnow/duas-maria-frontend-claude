import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Input from '@/components/ui/Input';
import StepNav from '@/components/checkout/StepNav';
import ShippingStep from '@/components/checkout/ShippingStep';
import CouponField from '@/components/checkout/CouponField';
import OrderReview from '@/components/checkout/OrderReview';
import StockShortage from '@/components/checkout/StockShortage';
import AddressForm from '@/components/account/AddressForm';
import { useFetch } from '@/hooks/useFetch';
import { goToExternal } from '@/lib/navigate';
import { track } from '@/lib/pixel';
import { pixelCartParams, useInitiateCheckout } from '@/lib/checkoutPixel';
import { checkoutAttemptKey, rememberGuestOrder } from '@/lib/guestOrders';
import {
  createGuestOrder,
  getGuestShippingOptions,
  startGuestPayment,
  validateGuestCoupon,
} from '@/services/guestCheckoutService';

const STEPS = ['Seus dados', 'Frete', 'Revisão'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mensagem do backend, ou a genérica; 429 = muitas tentativas. */
function apiMessage(err, fallback) {
  if (err?.response?.status === 429) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
  }
  const data = err?.response?.data;
  return data?.message || (data && typeof data === 'object' && Object.values(data)[0]) || fallback;
}

/*
 * Checkout de quem não está logado. Mesmos passos do checkout da conta, mas o
 * primeiro pede e-mail + endereço (com WhatsApp e CPF) em vez de escolher um
 * endereço salvo, e os itens vão do carrinho deste navegador. O backend
 * recalcula preço, estoque, frete e cupons; o e-mail recebe a confirmação e o
 * link para acompanhar o pedido.
 */
export default function GuestCheckout({ items, cartReady }) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [website, setWebsite] = useState(''); // campo escondido anti-robô
  const [address, setAddress] = useState(null);
  const [shippingServiceId, setShippingServiceId] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [placing, setPlacing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState(null);
  const [shortage, setShortage] = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null); // { orderId, token }

  useInitiateCheckout(cartReady, items);

  const cep = address?.pincode || null;
  const uf = address?.state || null;
  // A cotação só depende do endereço e das peças; o backend recota no pedido.
  const itemsKey = items.map((i) => `${i.variantId}:${i.quantity}`).join('|');
  const shippingFetcher = useCallback(() => {
    if (!cep || !uf) return Promise.resolve(null);
    return getGuestShippingOptions({ cep, uf, items }).catch((err) => {
      const msg = apiMessage(err, 'Não foi possível calcular o frete para este endereço.');
      const normalized = new Error(msg);
      normalized.response = { data: { message: msg } };
      throw normalized;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cep, uf, itemsKey]);
  const shipping = useFetch(shippingFetcher, [cep, uf, itemsKey]);

  const options = shipping.data || [];
  const effectiveShippingServiceId = options.some((o) => o.serviceId === shippingServiceId)
    ? shippingServiceId
    : (options[0]?.serviceId ?? null);
  const selectedShippingOption = options.find((o) => o.serviceId === effectiveShippingServiceId);
  const shippingReady = shipping.status === 'ready' && selectedShippingOption != null;

  const trimmedEmail = email.trim();
  const validateEmail = () => {
    const found = !trimmedEmail
      ? 'Informe seu e-mail'
      : EMAIL_RE.test(trimmedEmail)
        ? null
        : 'E-mail inválido';
    setEmailError(found);
    return found == null;
  };

  const validateCoupon = (code, appliedCodes) =>
    validateGuestCoupon(code, appliedCodes, {
      email: trimmedEmail,
      document: address?.document,
      items,
    });

  const goToPayment = (initPoint) => {
    // Pixel: pedido criado e pagamento iniciado — nunca antes.
    track('AddPaymentInfo', pixelCartParams(items, coupons));
    goToExternal(initPoint);
  };

  const handleConfirm = async () => {
    setPlacing(true);
    setError(null);
    setShortage(null);
    const request = {
      email: trimmedEmail,
      address,
      items,
      couponCodes: coupons.map((c) => c.code),
      shippingServiceId: effectiveShippingServiceId,
    };
    try {
      const { order, initPoint, paymentInitFailed, accessToken } = await createGuestOrder({
        ...request,
        idempotencyKey: checkoutAttemptKey(JSON.stringify(request)),
        website,
      });
      rememberGuestOrder(order?.orderId, accessToken);
      if (paymentInitFailed || !initPoint) {
        setPendingOrder({ orderId: order?.orderId, token: accessToken });
        setError('Pedido criado, mas não foi possível iniciar o pagamento agora.');
        return;
      }
      goToPayment(initPoint);
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 409 && Array.isArray(data?.unavailableItems)) {
        setShortage(data.unavailableItems);
      } else {
        setError(apiMessage(err, 'Não foi possível finalizar o pedido. Tente novamente.'));
        if (data?.message?.includes('frete escolhido')) shipping.refetch();
      }
    } finally {
      setPlacing(false);
    }
  };

  const handleRetryPayment = async () => {
    setRetrying(true);
    setError(null);
    try {
      const { initPoint } = await startGuestPayment(pendingOrder.orderId, pendingOrder.token);
      goToPayment(initPoint);
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

  return (
    <Container className="py-10 lg:py-14">
      <h1 className="font-display text-3xl text-foreground">Checkout</h1>
      <p className="mt-2 text-sm text-muted">
        Já tem conta?{' '}
        <Link
          to="/login"
          state={{ from: { pathname: '/checkout' } }}
          className="text-accent hover:underline"
        >
          Entrar
        </Link>{' '}
        — ou continue sem cadastro.
      </p>
      <StepNav steps={STEPS} current={step} className="mt-6" />

      <div className="mt-8">
        {step === 0 && (
          <AddressForm
            initial={address}
            submitLabel="Continuar"
            phoneLabel="WhatsApp"
            validateExtra={validateEmail}
            onSubmit={(values) => {
              setAddress(values);
              setStep(1);
            }}
            leading={
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Input
                  label="E-mail"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setEmailError(null);
                  }}
                  error={emailError}
                  hint="Para a confirmação do pedido e o link para acompanhar a entrega."
                />
                {/* Escondido de pessoas (e de leitores de tela); robôs costumam preencher. */}
                <div
                  aria-hidden="true"
                  className="absolute -left-[9999px] h-px w-px overflow-hidden"
                >
                  <label>
                    Site
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(event) => setWebsite(event.target.value)}
                    />
                  </label>
                </div>
                <p className="text-xs text-muted">
                  Usamos seu e-mail e WhatsApp só para este pedido: confirmação, entrega e, se você
                  não concluir, para falar com você sobre ele.
                </p>
              </div>
            }
          />
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
              address={address}
              shipping={selectedShippingOption}
              coupons={coupons}
              email={trimmedEmail}
            />
            <CouponField
              value={coupons}
              onApply={setCoupons}
              onRemove={(code) => setCoupons((list) => list.filter((c) => c.code !== code))}
              validate={validateCoupon}
            />
          </>
        )}
      </div>

      {shortage && <StockShortage items={shortage} />}

      {error && (
        <p role="alert" className="mt-6 text-sm text-danger">
          {error}
        </p>
      )}

      {step > 0 && (
        <div className="mt-8 flex justify-between">
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={placing}>
            Voltar
          </Button>
          {step === 1 ? (
            <Button onClick={() => setStep(2)} disabled={!shippingReady}>
              Continuar
            </Button>
          ) : (
            <Button onClick={handleConfirm} loading={placing} disabled={!shippingReady}>
              Ir para o pagamento
            </Button>
          )}
        </div>
      )}
    </Container>
  );
}
