import { useState } from 'react';
import { FiShoppingBag } from 'react-icons/fi';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Price from '@/components/ui/Price';
import { truncateText } from '@/components/utils/truncateText';
import { discountPercent } from '@/lib/format';
import ProductViewModal from './ProductViewModal';

/**
 * Card de produto — orientado a imagem. Abre o quick view ao clicar na
 * imagem ou no nome. O botao "Adicionar" sera ligado ao carrinho na
 * fase de Carrinho.
 */
export default function ProductCard({
  productId,
  productName,
  image,
  description,
  quantity,
  price,
  specialPrice,
}) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const inStock = Number(quantity) > 0;
  const pct = discountPercent(price, specialPrice);
  const product = { id: productId, productName, image, description, price, specialPrice };

  return (
    <div className="group flex flex-col">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Ver detalhes de ${productName}`}
          className="block aspect-[3/4] w-full overflow-hidden rounded-card bg-subtle"
        >
          {image && !imgError ? (
            <img
              src={image}
              alt={productName}
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs text-muted">
              sem imagem
            </span>
          )}
        </button>

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
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-left transition-colors hover:text-accent"
          >
            {truncateText(productName, 60)}
          </button>
        </h3>

        <Price price={price} specialPrice={specialPrice} className="text-sm" />

        <div className="mt-auto pt-2">
          <Button variant="secondary" size="sm" className="w-full" disabled={!inStock}>
            <FiShoppingBag size={16} />
            {inStock ? 'Adicionar' : 'Indisponível'}
          </Button>
        </div>
      </div>

      <ProductViewModal
        open={open}
        onClose={() => setOpen(false)}
        product={product}
        inStock={inStock}
      />
    </div>
  );
}
