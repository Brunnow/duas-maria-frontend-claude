import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiMinus, FiPlus } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Price from '@/components/ui/Price';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import ProductGallery from '@/components/product/ProductGallery';
import SizeSelector from '@/components/product/SizeSelector';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { addToCart, openDrawer } from '@/features/cart/cartSlice';
import { useProduct } from '@/hooks/useProduct';
import { cn } from '@/lib/cn';

const LOW_STOCK = 5;

const isSingleUnsized = (variants) => variants.length === 1 && variants[0].size === 'Único';

function ProdutoSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="mt-4 h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

export default function Produto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { status, product, variants, error, reload } = useProduct(id);

  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState(null);
  const [adding, setAdding] = useState(false);

  const singleUnsized = isSingleUnsized(variants);
  const effectiveVariantId = singleUnsized ? variants[0]?.variantId : selectedVariantId;

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.variantId === effectiveVariantId) || null,
    [variants, effectiveVariantId],
  );

  const maxQty = selectedVariant?.inStock ? selectedVariant.stock : 1;
  const qty = Math.min(quantity, maxQty);

  const handleSelectSize = (variantId) => {
    setSelectedVariantId(variantId);
    setQuantity(1);
    setFeedback(null);
  };

  const goToLogin = () =>
    navigate('/login', {
      state: { from: location, message: 'Entre para adicionar itens ao carrinho.' },
    });

  const handleAdd = async () => {
    if (!selectedVariant || !selectedVariant.inStock) return;
    // Sem sessao: leva ao login preservando a rota (a intencao de compra).
    if (!isAuthenticated) {
      goToLogin();
      return;
    }
    setAdding(true);
    setFeedback(null);
    try {
      await dispatch(
        addToCart({
          productId: product.productId,
          variantId: selectedVariant.variantId,
          quantity: qty,
        }),
      ).unwrap();
      dispatch(openDrawer());
    } catch (payload) {
      if (payload?.code === 'unauthorized') {
        goToLogin();
      } else if (payload?.code === 'already_in_cart') {
        // Ja esta no carrinho: abre o drawer para o usuario ajustar a quantidade.
        dispatch(openDrawer());
      } else {
        setFeedback({
          tone: 'error',
          message: payload?.message || 'Não foi possível adicionar ao carrinho.',
        });
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <Container className="py-10 lg:py-14">
      {status === 'loading' && <ProdutoSkeleton />}

      {status === 'notfound' && (
        <EmptyState
          title="Produto não encontrado"
          description="Esse produto pode ter saído do catálogo."
          action={
            <Button as={Link} to="/produtos" variant="secondary" size="sm">
              Ver todos os produtos
            </Button>
          }
        />
      )}

      {status === 'error' && (
        <ErrorState
          message={error}
          action={
            <Button onClick={reload} variant="secondary" size="sm">
              Tentar novamente
            </Button>
          }
        />
      )}

      {status === 'ready' && product && (
        <>
          <nav aria-label="Trilha de navegação" className="mb-6 text-xs text-muted">
            <Link to="/" className="hover:text-foreground">
              Início
            </Link>{' '}
            /{' '}
            <Link to="/produtos" className="hover:text-foreground">
              Produtos
            </Link>{' '}
            / <span className="text-foreground">{product.productName}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-2">
            <ProductGallery image={product.image} alt={product.productName} />

            <div className="flex flex-col gap-5">
              <h1 className="font-display text-3xl text-foreground lg:text-4xl">
                {product.productName}
              </h1>

              <Price
                price={product.price}
                specialPrice={product.specialPrice}
                showDiscount
                className="text-lg"
              />

              {!product.inStock && (
                <p className="text-sm font-medium text-danger">Produto esgotado no momento.</p>
              )}

              {!singleUnsized && variants.length > 0 && (
                <SizeSelector
                  variants={variants}
                  value={selectedVariantId}
                  onChange={handleSelectSize}
                />
              )}

              {variants.length === 0 && (
                <p className="text-sm text-muted">Tamanhos indisponíveis para este produto.</p>
              )}

              {!singleUnsized && !selectedVariant && variants.length > 0 && (
                <p className="text-sm text-muted">Selecione um tamanho.</p>
              )}

              {selectedVariant && !selectedVariant.inStock && (
                <p className="text-sm font-medium text-danger">Tamanho esgotado.</p>
              )}

              {selectedVariant?.inStock && selectedVariant.stock <= LOW_STOCK && (
                <p className="text-sm text-warning">
                  Últimas {selectedVariant.stock}{' '}
                  {selectedVariant.stock === 1 ? 'unidade' : 'unidades'}.
                </p>
              )}

              <div className="flex items-center gap-3">
                <div
                  role="group"
                  aria-label="Quantidade"
                  className="flex items-center rounded-control border border-border"
                >
                  <button
                    type="button"
                    onClick={() => setQuantity((n) => Math.max(1, n - 1))}
                    disabled={!selectedVariant?.inStock || qty <= 1}
                    aria-label="Diminuir quantidade"
                    className="flex h-10 w-10 items-center justify-center text-foreground disabled:opacity-40"
                  >
                    <FiMinus size={14} />
                  </button>
                  <span className="w-10 text-center text-sm tabular-nums">
                    {selectedVariant?.inStock ? qty : 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((n) => Math.min(maxQty, n + 1))}
                    disabled={!selectedVariant?.inStock || qty >= maxQty}
                    aria-label="Aumentar quantidade"
                    className="flex h-10 w-10 items-center justify-center text-foreground disabled:opacity-40"
                  >
                    <FiPlus size={14} />
                  </button>
                </div>

                <Button
                  onClick={handleAdd}
                  loading={adding}
                  disabled={!selectedVariant?.inStock}
                  className="flex-1 sm:flex-none sm:px-10"
                >
                  {!singleUnsized && !selectedVariant
                    ? 'Selecione um tamanho'
                    : selectedVariant && !selectedVariant.inStock
                      ? 'Tamanho esgotado'
                      : 'Adicionar ao carrinho'}
                </Button>
              </div>

              {feedback && (
                <p
                  role="status"
                  aria-live="polite"
                  className={cn(
                    'text-sm',
                    feedback.tone === 'success' && 'text-success',
                    feedback.tone === 'error' && 'text-danger',
                  )}
                >
                  {feedback.message}
                </p>
              )}

              {product.description && (
                <div className="mt-2 border-t border-border pt-5">
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                    Descrição
                  </h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Container>
  );
}
