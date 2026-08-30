import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Price from '@/components/ui/Price';

/**
 * Visualizacao rapida de um produto (quick view).
 * A pagina de produto completa (/produtos/:id) vem na fase de Produto.
 */
export default function ProductViewModal({ open, onClose, product, inStock }) {
  const { productName, image, description, price, specialPrice } = product || {};

  return (
    <Modal open={open} onClose={onClose} title={productName} size="lg">
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="aspect-[3/4] w-full overflow-hidden rounded-card bg-subtle sm:w-1/2">
          {image ? (
            <img src={image} alt={productName} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs text-muted">
              sem imagem
            </span>
          )}
        </div>

        <div className="flex w-full flex-col gap-4 sm:w-1/2">
          <div className="flex items-center justify-between gap-2">
            <Price price={price} specialPrice={specialPrice} showDiscount />
            <Badge tone={inStock ? 'success' : 'neutral'}>
              {inStock ? 'Em estoque' : 'Esgotado'}
            </Badge>
          </div>
          {description && <p className="text-sm leading-relaxed text-muted">{description}</p>}
        </div>
      </div>
    </Modal>
  );
}
