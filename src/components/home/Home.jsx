import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Container from '@/components/ui/Container';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import ProductGrid from '@/components/shared/ProductGrid';
import ProductGridSkeleton from '@/components/shared/ProductGridSkeleton';
import { fetchProducts } from '@/store/actions';
import Hero from './Hero';

const FEATURED_COUNT = 8;

export default function Home() {
  const dispatch = useDispatch();
  const { products } = useSelector((state) => state.products);
  const { isLoading, errorMessage } = useSelector((state) => state.errors);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const featured = Array.isArray(products) ? products.slice(0, FEATURED_COUNT) : [];

  return (
    <>
      <Hero />

      <Container as="section" className="py-16 lg:py-20">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="font-display text-3xl text-foreground">Peças em destaque</h2>
          <p className="text-sm text-muted">Uma seleção do que chegou por último.</p>
        </div>

        <div className="mt-10">
          {isLoading ? (
            <ProductGridSkeleton count={FEATURED_COUNT} />
          ) : errorMessage ? (
            <ErrorState message={errorMessage} />
          ) : featured.length === 0 ? (
            <EmptyState
              title="Nenhum produto por aqui ainda"
              description="Volte em breve para ver as novidades."
            />
          ) : (
            <ProductGrid products={featured} />
          )}
        </div>
      </Container>
    </>
  );
}
