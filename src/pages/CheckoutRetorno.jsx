import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Spinner from '@/components/ui/Spinner';
import OrderConfirmation from '@/components/checkout/OrderConfirmation';
import { fetchCart, loadGuestCart } from '@/features/cart/cartSlice';
import { selectAuth } from '@/features/auth/authSlice';
import { fetchOrderById, startMercadoPagoPayment } from '@/services/orderService';
import { fetchOrdersByAccessToken } from '@/services/publicOrderService';
import { startGuestPayment } from '@/services/guestCheckoutService';
import { guestOrderToken } from '@/lib/guestOrders';
import { removeGuestCartVariants } from '@/lib/guestCart';
import { goToExternal } from '@/lib/navigate';
import { money, track } from '@/lib/pixel';

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20; // ~1 min consultando antes de desistir de esperar

// Pedidos cujo Purchase já foi enviado ao Pixel neste navegador: F5 ou voltar
// para esta tela não conta a compra de novo.
const TRACKED_PURCHASES_KEY = 'dm-pixel-purchases';
const TRACKED_PURCHASES_MAX = 50;

function readTrackedPurchases() {
  try {
    const list = JSON.parse(window.localStorage.getItem(TRACKED_PURCHASES_KEY));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function trackPurchaseOnce(order) {
  const id = String(order.orderId);
  const tracked = readTrackedPurchases();
  if (tracked.includes(id)) return;
  try {
    window.localStorage.setItem(
      TRACKED_PURCHASES_KEY,
      JSON.stringify([...tracked, id].slice(-TRACKED_PURCHASES_MAX)),
    );
  } catch {
    // Sem armazenamento: dispara mesmo assim; o event_id ainda deixa a Meta deduplicar.
  }
  const items = order.orderItems || [];
  track(
    'Purchase',
    {
      content_type: 'product',
      content_ids: [
        ...new Set(
          items
            .map((item) => item.product?.productId)
            .filter(Boolean)
            .map(String),
        ),
      ],
      // Valor pago SEM o frete: totalAmount já vem com os cupons descontados e
      // inclui o frete, que aqui sai — é receita de produto, no mesmo critério
      // do InitiateCheckout.
      value: money(money(order.totalAmount) - money(order.shippingAmount)),
      currency: 'BRL',
      num_items: items.reduce((sum, item) => sum + (item.quantity ?? 0), 0),
    },
    id, // event_id = id do pedido, para a API de Conversões deduplicar depois
  );
}

/** Pedido sem cadastro: consulta pelo link "Meus pedidos" guardado ao criar o pedido. */
async function fetchGuestOrder(orderId, token) {
  const { orders = [] } = await fetchOrdersByAccessToken(token);
  const found = orders.find((o) => String(o.orderId) === String(orderId));
  if (!found) throw new Error('Pedido não encontrado');
  return found;
}

/*
 * Tela de volta do Checkout Pro (back_urls). O Mercado Pago pode anexar
 * parâmetros como status/payment_id na URL — NUNCA confiamos neles: a única
 * fonte da verdade é o nosso backend (GET /api/orders/{id}), que só reflete
 * a aprovação depois que o webhook processa. Por isso esta tela consulta em
 * polling em vez de ler o resultado da query string.
 *
 * Pública: quem comprou sem cadastro é consultado pelo token do link "Meus
 * pedidos" que o checkout guardou neste navegador (lib/guestOrders).
 */
export default function CheckoutRetorno() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const dispatch = useDispatch();
  const authStatus = useSelector(selectAuth).status;
  const authResolved = authStatus !== 'idle' && authStatus !== 'loading';
  const isGuest = authStatus === 'anonymous';
  const guestToken = isGuest ? guestOrderToken(orderId) : null;

  // loading | waiting | approved | rejected | cancelled | timeout | error
  const [phase, setPhase] = useState(orderId ? 'loading' : 'error');
  const [order, setOrder] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState(null);
  const pollsRef = useRef(0);

  useEffect(() => {
    if (!orderId || !authResolved) return; // sem orderId, phase já nasceu 'error'

    let alive = true;
    let timer;
    if (isGuest && !guestToken) {
      // Pedido sem cadastro feito em outro navegador (ou armazenamento limpo).
      Promise.resolve().then(() => alive && setPhase('error'));
      return () => {
        alive = false;
      };
    }

    const check = async () => {
      try {
        const dto = isGuest
          ? await fetchGuestOrder(orderId, guestToken)
          : await fetchOrderById(orderId);
        if (!alive) return;
        setOrder(dto);

        // Cancelado (abandono, admin ou estorno): não há o que esperar nem pagar de novo.
        if (dto.orderStatus === 'CANCELADO') {
          setPhase('cancelled');
          return;
        }
        if (dto.paymentStatus === 'APPROVED') {
          setPhase('approved');
          if (isGuest) {
            // Carrinho deste navegador: sai só o que foi pago.
            removeGuestCartVariants((dto.orderItems || []).map((item) => item.variantId));
            dispatch(loadGuestCart());
          } else {
            dispatch(fetchCart()); // o backend já esvaziou o carrinho ao aprovar
          }
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
  }, [orderId, dispatch, authResolved, isGuest, guestToken]);

  useEffect(() => {
    if (phase === 'approved' && order) trackPurchaseOnce(order);
  }, [phase, order]);

  const handleRetryPayment = async () => {
    setRetrying(true);
    setRetryError(null);
    try {
      const { initPoint } = isGuest
        ? await startGuestPayment(orderId, guestToken)
        : await startMercadoPagoPayment(orderId);
      goToExternal(initPoint);
    } catch {
      setRetryError('Não foi possível iniciar um novo pagamento. Tente novamente em instantes.');
      setRetrying(false);
    }
  };

  // Onde ver o pedido: área logada, ou o link "Meus pedidos" de quem não tem conta.
  const orderLink = isGuest
    ? guestToken
      ? `/acompanhar-pedido/${guestToken}`
      : '/acompanhar-pedido'
    : order
      ? `/pedidos/${order.orderId}`
      : '/pedidos';

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
        <OrderConfirmation order={order} detailsTo={orderLink} />
        {isGuest && (
          <p className="mt-4 text-center text-sm text-muted">
            Enviamos a confirmação para o seu e-mail, com o link para acompanhar o pedido.
          </p>
        )}
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

  if (phase === 'cancelled') {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-md text-center">
          <p className="font-display text-2xl text-foreground">Pedido cancelado</p>
          <p className="mt-2 text-sm text-muted">
            Este pedido foi cancelado e não pode mais ser pago. Se ainda quiser as peças, é só fazer
            um novo pedido pelo carrinho.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button as={Link} to="/carrinho">
              Ir para o carrinho
            </Button>
            <Button as={Link} to={orderLink} variant="secondary">
              Ver o pedido
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
          <Button as={Link} to={orderLink} className="mt-6">
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
          {isGuest
            ? 'Se você concluiu um pagamento, a confirmação chega no seu e-mail. Você também pode pedir o link dos seus pedidos em Acompanhar pedido.'
            : 'Se você concluiu um pagamento, confira o resultado em Meus Pedidos.'}
        </p>
        <Button as={Link} to={isGuest ? '/acompanhar-pedido' : '/pedidos'} className="mt-6">
          {isGuest ? 'Acompanhar pedido' : 'Ver meus pedidos'}
        </Button>
      </div>
    </Container>
  );
}
