import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import CartLineItem from '@/components/cart/CartLineItem';
import { selectCart } from '@/features/cart/cartSlice';
import { formatCurrency } from '@/lib/format';

/* Rota protegida (ver App.jsx) — so renderiza para usuario autenticado. */
export default function Carrinho() {
  const { cartId, items, totalPrice, opError } = useSelector(selectCart);

  return (
    <Container className="py-10 lg:py-14">
      <h1 className="font-display text-3xl text-foreground">Carrinho</h1>

      {opError && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {opError}
        </p>
      )}

      {items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted">Seu carrinho está vazio.</p>
          <Button as={Link} to="/produtos" variant="secondary">
            Explorar produtos
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
          <ul className="divide-y divide-border border-y border-border">
            {items.map((item) => (
              <li key={item.cartItemId}>
                <CartLineItem item={item} cartId={cartId} />
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-card border border-border p-5">
            <h2 className="font-display text-lg text-foreground">Resumo</h2>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="text-foreground">{formatCurrency(totalPrice)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-sm font-medium">
              <span>Total</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            <Button as={Link} to="/checkout" className="mt-5 w-full">
              Finalizar compra
            </Button>
          </aside>
        </div>
      )}
    </Container>
  );
}
