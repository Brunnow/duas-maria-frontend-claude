import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@/components/ui/Button';
import Drawer from '@/components/ui/Drawer';
import {
  closeDrawer,
  selectCart,
  selectCartCount,
  selectCartDrawerOpen,
} from '@/features/cart/cartSlice';
import { formatCurrency } from '@/lib/format';
import CartLineItem from './CartLineItem';

export default function CartDrawer() {
  const dispatch = useDispatch();
  const open = useSelector(selectCartDrawerOpen);
  const { cartId, items, totalPrice, opError } = useSelector(selectCart);
  const count = useSelector(selectCartCount);
  const close = () => dispatch(closeDrawer());

  const footer =
    items.length > 0 ? (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Subtotal</span>
          <span className="font-medium text-foreground">{formatCurrency(totalPrice)}</span>
        </div>
        <Button as={Link} to="/checkout" onClick={close} className="w-full">
          Finalizar compra
        </Button>
        <Button as={Link} to="/carrinho" onClick={close} variant="secondary" className="w-full">
          Ver carrinho
        </Button>
      </div>
    ) : null;

  return (
    <Drawer open={open} onClose={close} side="right" title={`Carrinho (${count})`} footer={footer}>
      {opError && (
        <p role="alert" className="mb-3 text-sm text-danger">
          {opError}
        </p>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-muted">Seu carrinho está vazio.</p>
          <Button as={Link} to="/produtos" onClick={close} variant="secondary" size="sm">
            Explorar produtos
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.cartItemId}>
              <CartLineItem item={item} cartId={cartId} compact />
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
