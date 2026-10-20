import { Link } from 'react-router-dom';
import { FiShoppingBag } from 'react-icons/fi';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Price from '@/components/ui/Price';
import { truncateText } from '@/components/utils/truncateText';
import { discountPercent, formatCurrency } from '@/lib/format';
import { INTEREST_FREE_INSTALLMENTS, installmentValue } from '@/lib/installments';
import { isOnSale } from '@/lib/returnPolicy';
import OptimizedImage from '@/components/shared/OptimizedImage';
import ColorSwatch from '@/components/shared/ColorSwatch';

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
  colors,
}) {
  const inStock = Number(quantity) > 0;
  const pct = discountPercent(price, specialPrice);
  const href = `/produtos/${productId}`;
  const installment = installmentValue(isOnSale(price, specialPrice) ? specialPrice : price);

  return (
    <div className="group flex flex-col">
      <div className="relative">
        <Link
          to={href}
          aria-label={`Ver ${productName}`}
          className="block aspect-[3/4] w-full overflow-hidden rounded-card bg-subtle"
        >
          {image ? (
            <OptimizedImage
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

        {colors?.length > 1 && <CardColors href={href} colors={colors} />}

        <div>
          <Price price={price} specialPrice={specialPrice} className="text-sm" />
          {installment != null && (
            <p className="mt-0.5 text-xs text-muted">
              ou {INTEREST_FREE_INSTALLMENTS}x de {formatCurrency(installment)} sem juros
            </p>
          )}
        </div>

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

const MAX_CARD_COLORS = 5;

/** Bolinhas/miniaturas das cores; cada uma abre o produto já naquela cor. */
function CardColors({ href, colors }) {
  const shown = colors.slice(0, MAX_CARD_COLORS);
  const extra = colors.length - shown.length;
  return (
    <ul className="flex flex-wrap items-center gap-1.5" aria-label={`${colors.length} cores`}>
      {shown.map((c) => (
        <li key={c.name}>
          <Link
            to={`${href}?cor=${encodeURIComponent(c.name)}`}
            aria-label={c.inStock ? `Ver na cor ${c.name}` : `Ver na cor ${c.name} (esgotada)`}
            title={c.name}
            className="block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <ColorSwatch
              name={c.name}
              hex={c.hex}
              image={c.image}
              size="md"
              soldOut={!c.inStock}
              className="h-6 w-6"
            />
          </Link>
        </li>
      ))}
      {extra > 0 && <li className="text-xs text-muted">+{extra}</li>}
    </ul>
  );
}
