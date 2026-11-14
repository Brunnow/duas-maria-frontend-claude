import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { variantLabel } from '@/lib/variants';

/** Itens que ficaram sem estoque na hora de criar o pedido (409 com unavailableItems). */
export default function StockShortage({ items }) {
  return (
    <div role="alert" className="mt-6 rounded-card border border-danger/30 bg-danger/5 p-4 text-sm">
      <p className="font-medium text-danger">Alguns itens ficaram sem estoque suficiente:</p>
      <ul className="mt-2 list-disc pl-5 text-muted">
        {items.map((item) => (
          <li key={item.variantId}>
            {item.productName} ({variantLabel(item.color, item.size)}) — pedido {item.requested},
            disponível {item.available}
          </li>
        ))}
      </ul>
      <Button as={Link} to="/carrinho" variant="secondary" size="sm" className="mt-3">
        Revisar carrinho
      </Button>
    </div>
  );
}
