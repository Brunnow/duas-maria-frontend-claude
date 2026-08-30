import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { decrementItem, incrementItem, removeItem } from '@/features/cart/cartSlice';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';

/**
 * Linha do carrinho — usada no CartDrawer e na pagina /carrinho.
 * A quantidade muda de 1 em 1 (limite do backend); o backend valida
 * estoque e devolve o carrinho atualizado.
 */
export default function CartLineItem({ item, cartId, compact = false }) {
  const dispatch = useDispatch();
  const [busy, setBusy] = useState(false);

  const run = async (action, arg) => {
    setBusy(true);
    try {
      await dispatch(action(arg)).unwrap();
    } catch {
      // A mensagem fica em cart.opError, exibida pelo container.
    } finally {
      setBusy(false);
    }
  };

  const href = `/produtos/${item.productId}`;

  return (
    <div className="flex gap-3 py-4 sm:gap-4">
      <Link
        to={href}
        className={cn(
          'shrink-0 overflow-hidden rounded-card bg-subtle',
          compact ? 'h-24 w-20' : 'h-32 w-24',
        )}
      >
        {item.image ? (
          <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[10px] text-muted">
            sem imagem
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={href}
              className="block truncate text-sm text-foreground transition-colors hover:text-accent"
            >
              {item.productName}
            </Link>
            <p className="mt-0.5 text-xs text-muted">Tamanho: {item.size}</p>
          </div>
          <button
            type="button"
            onClick={() => run(removeItem, { cartId, variantId: item.variantId })}
            disabled={busy}
            aria-label={`Remover ${item.productName} tamanho ${item.size}`}
            className="rounded-control p-1 text-muted transition-colors hover:bg-subtle hover:text-danger disabled:opacity-40"
          >
            <FiTrash2 size={16} />
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div
            role="group"
            aria-label="Quantidade"
            className="flex items-center rounded-control border border-border"
          >
            <button
              type="button"
              onClick={() => run(decrementItem, item.variantId)}
              disabled={busy}
              aria-label="Diminuir quantidade"
              className="flex h-8 w-8 items-center justify-center text-foreground disabled:opacity-40"
            >
              <FiMinus size={12} />
            </button>
            <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
            <button
              type="button"
              onClick={() => run(incrementItem, item.variantId)}
              disabled={busy}
              aria-label="Aumentar quantidade"
              className="flex h-8 w-8 items-center justify-center text-foreground disabled:opacity-40"
            >
              <FiPlus size={12} />
            </button>
          </div>
          <span className="text-sm font-medium text-foreground">
            {formatCurrency(item.lineTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
