/*
 * Pedidos feitos sem cadastro neste navegador: guarda o token do link "Meus
 * pedidos" que o backend devolve ao criar o pedido, para a tela de retorno do
 * Mercado Pago consultar o pedido sem login. Só o id do pedido e o token —
 * nenhum dado pessoal. O token vale 7 dias no backend.
 */
const ORDERS_KEY = 'dm-guest-orders';
const ORDERS_MAX = 10;

// Id aleatório da tentativa de checkout atual (idempotencyKey): reenviar o
// mesmo pedido (duplo clique, nova tentativa) reaproveita o pedido criado.
const ATTEMPT_KEY = 'dm-guest-checkout-attempt';

function readOrders() {
  try {
    const list = JSON.parse(window.localStorage.getItem(ORDERS_KEY));
    return Array.isArray(list) ? list.filter((o) => o?.orderId != null && o?.token) : [];
  } catch {
    return [];
  }
}

export function rememberGuestOrder(orderId, token) {
  if (orderId == null || !token) return;
  const others = readOrders().filter((o) => String(o.orderId) !== String(orderId));
  try {
    window.localStorage.setItem(
      ORDERS_KEY,
      JSON.stringify([...others, { orderId: String(orderId), token }].slice(-ORDERS_MAX)),
    );
  } catch {
    // Sem armazenamento: a tela de retorno manda para "Acompanhar pedido".
  }
}

export function guestOrderToken(orderId) {
  if (orderId == null) return null;
  return readOrders().find((o) => o.orderId === String(orderId))?.token ?? null;
}

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

const LEAD_KEY = 'dm-checkout-lead';

/** Id aleatório do "checkout iniciado" desta aba: o mesmo enquanto ela estiver aberta. */
export function checkoutLeadKey() {
  try {
    const saved = window.sessionStorage.getItem(LEAD_KEY);
    if (saved) return saved;
    const key = randomId();
    window.sessionStorage.setItem(LEAD_KEY, key);
    return key;
  } catch {
    return randomId();
  }
}

/**
 * idempotencyKey do pedido: o mesmo enquanto o conteúdo do pedido
 * (`fingerprint`) não muda; mudou carrinho, endereço, frete ou cupom = id novo.
 */
export function checkoutAttemptKey(fingerprint) {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(ATTEMPT_KEY));
    if (saved?.fingerprint === fingerprint && saved?.key) return saved.key;
  } catch {
    // segue e gera um novo
  }
  const key = randomId();
  try {
    window.sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify({ fingerprint, key }));
  } catch {
    // Sem armazenamento: cada clique vira uma tentativa nova (o botão já trava o duplo clique).
  }
  return key;
}
