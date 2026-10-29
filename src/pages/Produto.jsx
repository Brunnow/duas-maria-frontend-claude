import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { FiMinus, FiPlus } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Price from '@/components/ui/Price';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import Seo from '@/components/shared/Seo';
import ColorSelector from '@/components/product/ColorSelector';
import ProductGallery from '@/components/product/ProductGallery';
import SizeSelector from '@/components/product/SizeSelector';
import { addToCart, openDrawer } from '@/features/cart/cartSlice';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useProduct } from '@/hooks/useProduct';
import { cn } from '@/lib/cn';
import { money, track } from '@/lib/pixel';
import { siteOrigin } from '@/lib/seo';
import { RETURN_POLICY_PATH, RETURN_WINDOW_DAYS, isOnSale } from '@/lib/returnPolicy';
import { groupByColor, hasColors, sameColor } from '@/lib/variants';

const LOW_STOCK = 5;

const isSingleUnsized = (variants) => variants.length === 1 && variants[0].size === 'Único';

/**
 * Cores para o seletor: as do produto (com bolinha/miniatura) ou, se não
 * vierem, as das variações. Vazio = produto sem cor.
 */
function colorOptions(product, variants) {
  if (!hasColors(variants)) return [];
  if (product?.colors?.length) return product.colors;
  return groupByColor(variants).map((g) => ({
    name: g.color,
    hex: null,
    image: null,
    inStock: g.variants.some((v) => v.inStock),
  }));
}

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
  const dispatch = useDispatch();
  // Celular/tablet: tamanho e botão de comprar vão para a barra fixa do rodapé.
  const isDesktop = useMediaQuery('(min-width: 1024px)', true);
  const { status, product, variants: allVariants, error, reload } = useProduct(id);
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState(null);
  const [adding, setAdding] = useState(false);

  // Pixel: ViewContent uma vez por produto aberto (o ref segura o efeito
  // duplo do StrictMode e as recargas do mesmo produto).
  const viewedRef = useRef(null);
  useEffect(() => {
    if (status !== 'ready' || !product || viewedRef.current === product.productId) return;
    viewedRef.current = product.productId;
    track('ViewContent', {
      content_type: 'product',
      content_ids: [String(product.productId)],
      content_name: product.productName,
      value: money(product.specialPrice ?? product.price),
      currency: 'BRL',
    });
  }, [status, product]);

  // Cor: a da URL (?cor=Verde, vinda do card ou de um link compartilhado) ou a
  // primeira com estoque. Os tamanhos e as fotos mostrados são os dessa cor.
  const colors = useMemo(() => colorOptions(product, allVariants), [product, allVariants]);
  const wantedColor = searchParams.get('cor');
  const selectedColor = colors.length
    ? (
        colors.find((c) => sameColor(c.name, wantedColor)) ||
        colors.find((c) => c.inStock) ||
        colors[0]
      ).name
    : '';
  const variants = useMemo(
    () =>
      colors.length ? allVariants.filter((v) => sameColor(v.color, selectedColor)) : allVariants,
    [allVariants, colors.length, selectedColor],
  );

  const singleUnsized = isSingleUnsized(variants);
  const effectiveVariantId = singleUnsized ? variants[0]?.variantId : selectedVariantId;

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.variantId === effectiveVariantId) || null,
    [variants, effectiveVariantId],
  );

  const galleryImages = useMemo(() => {
    const images = product?.images || [];
    if (!colors.length) return images;
    const ofColor = images.filter((img) => !img.color || sameColor(img.color, selectedColor));
    return ofColor.length ? ofColor : images;
  }, [product, colors.length, selectedColor]);

  const handleSelectColor = (name) => {
    if (sameColor(name, selectedColor)) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('cor', name);
        return next;
      },
      { replace: true },
    );
    setSelectedVariantId(null);
    setQuantity(1);
    setFeedback(null);
  };

  const maxQty = selectedVariant?.inStock ? selectedVariant.stock : 1;
  const qty = Math.min(quantity, maxQty);

  const handleSelectSize = (variantId) => {
    setSelectedVariantId(variantId);
    setQuantity(1);
    setFeedback(null);
  };

  const handleAdd = async () => {
    if (!selectedVariant || !selectedVariant.inStock) return;
    // Sem login a peça entra no carrinho do navegador; o login só é pedido
    // no checkout. `item` é o que o carrinho do visitante mostra.
    setAdding(true);
    setFeedback(null);
    try {
      await dispatch(
        addToCart({
          productId: product.productId,
          variantId: selectedVariant.variantId,
          quantity: qty,
          item: {
            productName: product.productName,
            image: galleryImages[0]?.url || product.image,
            color: selectedVariant.color || selectedColor,
            size: selectedVariant.size,
            unitPrice: isOnSale(product.price, product.specialPrice)
              ? product.specialPrice
              : product.price,
            stock: selectedVariant.stock,
          },
        }),
      ).unwrap();
      const unitPrice = money(product.specialPrice ?? product.price);
      track('AddToCart', {
        content_type: 'product',
        content_ids: [String(product.productId)],
        content_name: product.productName,
        value: money(unitPrice * qty),
        currency: 'BRL',
        contents: [{ id: String(product.productId), quantity: qty }],
      });
      dispatch(openDrawer());
    } catch (payload) {
      if (payload?.code === 'already_in_cart') {
        // Ja esta no carrinho: avisa (antes so abria o drawer, sem explicar por
        // que a quantidade escolhida nao entrou) e abre para ajustar la.
        setFeedback({
          tone: 'info',
          message: 'Esse tamanho já está no seu carrinho. Ajuste a quantidade por lá.',
        });
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

  const addLabel =
    !singleUnsized && !selectedVariant
      ? 'Selecione um tamanho'
      : selectedVariant && !selectedVariant.inStock
        ? 'Tamanho esgotado'
        : 'Adicionar ao carrinho';

  const sizeSelector = !singleUnsized && variants.length > 0 && (
    <SizeSelector
      variants={variants}
      value={selectedVariantId}
      onChange={handleSelectSize}
      compact={!isDesktop}
    />
  );

  const addButton = (className) => (
    <Button
      onClick={handleAdd}
      loading={adding}
      disabled={!selectedVariant?.inStock}
      className={className}
    >
      {addLabel}
    </Button>
  );

  const feedbackText = feedback && (
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
  );

  return (
    <Container className="py-10 lg:py-14">
      {status === 'ready' && product && (
        <ProductSeo
          product={product}
          inStock={
            allVariants.length > 0
              ? allVariants.some((v) => v.inStock)
              : Number(product.quantity) > 0
          }
        />
      )}
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
            <ProductGallery
              key={`${product.productId}-${selectedColor}`}
              images={galleryImages}
              image={product.image}
              alt={
                selectedColor ? `${product.productName} — ${selectedColor}` : product.productName
              }
            />

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

              {colors.length > 0 && (
                <ColorSelector colors={colors} value={selectedColor} onChange={handleSelectColor} />
              )}

              {product.inStock && colors.length > 0 && !variants.some((v) => v.inStock) && (
                <p className="text-sm font-medium text-danger">
                  {selectedColor} esgotada. Veja as outras cores.
                </p>
              )}

              {isDesktop && sizeSelector}

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
                  {selectedVariant.stock === 1
                    ? 'Última unidade.'
                    : `Últimas ${selectedVariant.stock} unidades.`}
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

                {isDesktop && addButton('px-10')}
              </div>

              {isDesktop && feedbackText}

              <p className="text-xs text-muted">
                {isOnSale(product.price, product.specialPrice)
                  ? `Peça em promoção: não tem troca. Arrependimento em até ${RETURN_WINDOW_DAYS} dias garantido.`
                  : `Primeira troca grátis em até ${RETURN_WINDOW_DAYS} dias.`}{' '}
                <Link
                  to={RETURN_POLICY_PATH}
                  className="text-foreground underline underline-offset-4 hover:text-accent"
                >
                  Trocas e devoluções
                </Link>
              </p>

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

          {!isDesktop && (
            <StickyBuyBar>
              {sizeSelector}
              <div className="flex items-center gap-3">
                <Price
                  price={product.price}
                  specialPrice={product.specialPrice}
                  className="shrink-0 flex-col gap-y-0 text-sm"
                />
                {addButton('flex-1')}
              </div>
              {feedbackText}
            </StickyBuyBar>
          )}
        </>
      )}
    </Container>
  );
}

/**
 * Barra fixa no rodapé (celular/tablet) com tamanho + botão de comprar, à
 * vista sem rolar. Publica a própria altura em --buy-bar-h para o Layout
 * reservar o espaço no fim da página e os botões flutuantes subirem.
 */
function StickyBuyBar({ children }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const update = () =>
      root.style.setProperty('--buy-bar-h', `${ref.current?.offsetHeight || 0}px`);
    update();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (observer && ref.current) observer.observe(ref.current);
    return () => {
      observer?.disconnect();
      root.style.removeProperty('--buy-bar-h');
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-label="Comprar"
      role="region"
      className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-2 border-t border-border bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-pop"
    >
      {children}
    </div>
  );
}

/**
 * Título e descrição do produto no Google, e os dados estruturados (preço,
 * disponibilidade) que permitem ao Google mostrar o preço no resultado.
 */
function ProductSeo({ product, inStock }) {
  const onSale = isOnSale(product.price, product.specialPrice);
  const price = Number(onSale ? product.specialPrice : product.price);
  const url = `${siteOrigin()}/produtos/${product.productId}`;
  const description =
    product.description ||
    `${product.productName} na Duas Maria. Entrega para todo o Brasil e até 6x sem juros.`;

  return (
    <Seo
      title={product.productName}
      description={description}
      image={product.image}
      type="product"
      jsonLd={{
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.productName,
        description,
        image: product.image ? [product.image] : undefined,
        sku: String(product.productId),
        // Sem "brand": a loja revende outras marcas (ex.: FARM) e o produto não
        // tem campo de marca. A Duas Maria entra como vendedora da oferta.
        offers: {
          '@type': 'Offer',
          url,
          priceCurrency: 'BRL',
          price: Number.isFinite(price) ? price.toFixed(2) : undefined,
          availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@type': 'Organization', name: 'Duas Maria' },
          hasMerchantReturnPolicy: {
            '@type': 'MerchantReturnPolicy',
            applicableCountry: 'BR',
            returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
            merchantReturnDays: RETURN_WINDOW_DAYS,
            returnMethod: 'https://schema.org/ReturnByMail',
          },
        },
      }}
    />
  );
}
