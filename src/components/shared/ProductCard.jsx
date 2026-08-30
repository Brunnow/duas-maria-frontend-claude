import { Link } from 'react-router-dom';
import { FiShoppingBag } from 'react-icons/fi';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Price from '@/components/ui/Price';
import { truncateText } from '@/components/utils/truncateText';
import { discountPercent } from '@/lib/format';

/**
 * Card de produto — orientado a imagem. A imagem e o nome levam a pagina
 * do produto (/produtos/:id). O botao "Adicionar" sera ligado ao carrinho
 * na fase de Carrinho.
 */
export default function ProductCard({
  productId,
  productName,
  image,
  quantity,
  price,
  specialPrice,
}) {
  const inStock = Number(quantity) > 0;
  const pct = discountPercent(price, specialPrice);
  const href = `/produtos/${productId}`;

  return (
    <div className="group flex flex-col">
      <div className="relative">
        <Link
          to={href}
          aria-label={`Ver ${productName}`}
          className="block aspect-[3/4] w-full overflow-hidden rounded-card bg-subtle"
        >
          {image ? (
            <img
              src={image}
              alt={productName}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs text-muted">
              sem imagem
            </span>
          )}
        </Link>

        {pct != null && (
          <Badge tone="accent" className="absolute left-3 top-3">
            -{pct}%
          </Badge>
        )}
        {!inStock && (
          <Badge tone="neutral" className="absolute right-3 top-3">
            Esgotado
          </Badge>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-2">
        <h3 className="text-sm text-foreground">
          <Link to={href} className="transition-colors hover:text-accent">
            {truncateText(productName, 60)}
          </Link>
        </h3>

        <Price price={price} specialPrice={specialPrice} className="text-sm" />

        <div className="mt-auto pt-2">
          <Button as={Link} to={href} variant="secondary" size="sm" className="w-full">
            <FiShoppingBag size={16} />
            Ver produto
          </Button>
        </div>
      </div>
    </div>
  );
}
