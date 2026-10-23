import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import ProductGrid from '@/components/shared/ProductGrid';
import ProductGridSkeleton from '@/components/shared/ProductGridSkeleton';
import Seo from '@/components/shared/Seo';
import { useRetryWhenVisible } from '@/hooks/useRetryWhenVisible';
import { fetchProducts } from '@/store/actions';
import CategoryShowcase from './CategoryShowcase';
import Hero from './Hero';
import HighlightsStrip from './HighlightsStrip';

const FEATURED_COUNT = 8;
// Busca mais que 8 porque os esgotados (nenhum tamanho com estoque) saem dos
// destaques — a API não filtra por estoque, mas cada produto já vem com inStock.
const FEATURED_FETCH = 24;
// Mais novos primeiro: o id cresce a cada produto cadastrado, e o padrão da
// API (id crescente) mostraria justamente as peças mais antigas.
const FEATURED_QUERY = `pageSize=${FEATURED_FETCH}&sortBy=productId&sortOrder=desc`;

export default function Home() {
  const dispatch = useDispatch();
  const { products } = useSelector((state) => state.products);
  const { isLoading, errorMessage } = useSelector((state) => state.errors);

  const loadFeatured = useCallback(() => dispatch(fetchProducts(FEATURED_QUERY)), [dispatch]);

  useEffect(() => {
    loadFeatured();
  }, [loadFeatured]);

  useRetryWhenVisible(Boolean(errorMessage), loadFeatured);

  const featured = Array.isArray(products)
    ? products.filter((product) => product.inStock).slice(0, FEATURED_COUNT)
    : [];

  return (
    <>
      <Seo />
      <Hero />

      <HighlightsStrip />

      <CategoryShowcase />

      <Container as="section" className="py-16 lg:py-20">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="font-display text-3xl text-foreground">Peças em destaque</h2>
          <p className="text-sm text-muted">Uma seleção do que chegou por último.</p>
        </div>

        <div className="mt-10">
          {isLoading ? (
            <ProductGridSkeleton count={FEATURED_COUNT} />
          ) : errorMessage ? (
            <ErrorState
              message={errorMessage}
              action={
                <Button variant="secondary" size="sm" onClick={loadFeatured}>
                  Tentar de novo
                </Button>
              }
            />
          ) : featured.length === 0 ? (
            <EmptyState
              title="Nenhum produto por aqui ainda"
              description="Volte em breve para ver as novidades."
            />
          ) : (
            <>
              <ProductGrid products={featured} />
              <div className="mt-10 flex justify-center">
                <Link
                  to="/produtos"
                  className="group inline-flex items-center gap-1.5 text-sm text-muted underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  Ver todos os produtos
                  <FiArrowRight
                    size={14}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
            </>
          )}
        </div>
      </Container>
    </>
  );
}
