import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Spinner from '@/components/ui/Spinner';
import OrderConfirmation from '@/components/checkout/OrderConfirmation';
import { fetchCart } from '@/features/cart/cartSlice';
import { fetchOrderById, startMercadoPagoPayment } from '@/services/orderService';
import { goToExternal } from '@/lib/navigate';

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20; // ~1 min consultando antes de desistir de esperar

/*
 * Tela de volta do Checkout Pro (back_urls). O Mercado Pago pode anexar
 * parâmetros como status/payment_id na URL — NUNCA confiamos neles: a única
 * fonte da verdade é o nosso backend (GET /api/orders/{id}), que só reflete
 * a aprovação depois que o webhook processa. Por isso esta tela consulta em
 * polling em vez de ler o resultado da query string.
 */
export default function CheckoutRetorno() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const dispatch = useDispatch();

  // loading | waiting | approved | rejected | timeout | error
  const [phase, setPhase] = useState(orderId ? 'loading' : 'error');
  const [order, setOrder] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState(null);
  const pollsRef = useRef(0);

  useEffect(() => {
    if (!orderId) return; // phase já nasceu 'error' (estado inicial)

    let alive = true;
    let timer;

    const check = async () => {
      try {
        const dto = await fetchOrderById(orderId);
        if (!alive) return;
        setOrder(dto);

        if (dto.paymentStatus === 'APPROVED') {
          setPhase('approved');
          dispatch(fetchCart()); // o backend já esvaziou o carrinho ao aprovar
          return;
        }
        if (dto.paymentStatus === 'REJECTED') {
          setPhase('rejected');
          return;
        }

        pollsRef.current += 1;
        if (pollsRef.current >= MAX_POLLS) {
          setPhase('timeout');
          return;
        }
        setPhase('waiting');
        timer = setTimeout(check, POLL_INTERVAL_MS);
      } catch {
        if (alive) setPhase('error');
      }
    };

    check();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [orderId, dispatch]);

  const handleRetryPayment = async () => {
    setRetrying(true);
    setRetryError(null);
    try {
      const { initPoint } = await startMercadoPagoPayment(orderId);
      goToExternal(initPoint);
    } catch {
      setRetryError('Não foi possível iniciar um novo pagamento. Tente novamente em instantes.');
      setRetrying(false);
    }
  };

  if (phase === 'loading' || phase === 'waiting') {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-md text-center">
          <Spinner className="mx-auto size-8" />
          <p className="mt-4 font-display text-xl text-foreground">Confirmando seu pagamento…</p>
          <p className="mt-2 text-sm text-muted">
            Isso costuma ser rápido no Pix e no cartão. Se você escolheu boleto, a confirmação só
            chega depois da compensação.
          </p>
        </div>
      </Container>
    );
  }

  if (phase === 'approved') {
    return (
      <Container className="py-10 lg:py-14">
        <OrderConfirmation order={order} />
      </Container>
    );
  }

  if (phase === 'rejected') {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-md text-center">
          <p className="font-display text-2xl text-foreground">Pagamento recusado</p>
          <p className="mt-2 text-sm text-muted">
            O Mercado Pago não aprovou esse pagamento. Você pode tentar novamente com outro cartão
            ou forma de pagamento.
          </p>
          {retryError && (
            <p role="alert" className="mt-4 text-sm text-danger">
              {retryError}
            </p>
          )}
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button onClick={handleRetryPayment} loading={retrying}>
              Tentar novamente
            </Button>
            <Button as={Link} to="/carrinho" variant="secondary">
              Voltar ao carrinho
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  if (phase === 'timeout') {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-md text-center">
          <p className="font-display text-2xl text-foreground">Ainda processando</p>
          <p className="mt-2 text-sm text-muted">
            Está demorando mais que o esperado para confirmar. Isso pode acontecer com boleto ou Pix
            pendente — você pode acompanhar o status a qualquer momento em Meus Pedidos.
          </p>
          <Button as={Link} to={order ? `/pedidos/${order.orderId}` : '/pedidos'} className="mt-6">
            Ver meus pedidos
          </Button>
        </div>
      </Container>
    );
  }

  // error — sem orderId na URL, ou o pedido não pôde ser consultado
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md text-center">
        <p className="font-display text-2xl text-foreground">Não encontramos esse pedido</p>
        <p className="mt-2 text-sm text-muted">
          Se você concluiu um pagamento, confira o resultado em Meus Pedidos.
        </p>
        <Button as={Link} to="/pedidos" className="mt-6">
          Ver meus pedidos
        </Button>
      </div>
    </Container>
  );
}
