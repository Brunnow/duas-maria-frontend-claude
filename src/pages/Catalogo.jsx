import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiFilter } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Pagination from '@/components/ui/Pagination';
import CatalogFilters from '@/components/catalog/CatalogFilters';
import FiltersDrawer from '@/components/catalog/FiltersDrawer';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import ProductGrid from '@/components/shared/ProductGrid';
import ProductGridSkeleton from '@/components/shared/ProductGridSkeleton';
import Seo from '@/components/shared/Seo';
import { useCatalog } from '@/hooks/useCatalog';
import { useRetryWhenVisible } from '@/hooks/useRetryWhenVisible';
import { fetchCategories } from '@/store/actions';

const PAGE_SIZE_HINT = 12;

export default function Catalogo() {
  const dispatch = useDispatch();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { filters, setCategory, setSort, setKeyword, setPage, clear, reload } = useCatalog();
  const { products, categories, pagination } = useSelector((state) => state.products);
  const { isLoading, errorMessage } = useSelector((state) => state.errors);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useRetryWhenVisible(Boolean(errorMessage), reload);

  const list = Array.isArray(products) ? products : [];
  const total = pagination?.totalElements ?? 0;
  const totalPages = pagination?.totalPages ?? 0;
  const hasActiveFilters = Boolean(filters.category || filters.keyword || filters.sort !== 'asc');

  const filterProps = {
    categories: categories || [],
    category: filters.category,
    sort: filters.sort,
    keyword: filters.keyword,
    onCategory: setCategory,
    onSort: setSort,
    onKeyword: setKeyword,
    onClear: clear,
    hasActiveFilters,
  };

  const seoTitle = filters.keyword
    ? `Busca: ${filters.keyword}`
    : filters.category
      ? `${filters.category} — Moda feminina`
      : 'Produtos — Moda feminina';

  return (
    <Container className="py-10 lg:py-14">
      <Seo
        title={seoTitle}
        description={
          filters.category
            ? `${filters.category} na Duas Maria: peças femininas com curadoria, entrega para todo o Brasil e até 6x sem juros.`
            : 'Vestidos, blusas, calças e mais: veja todas as peças da Duas Maria, com entrega para todo o Brasil e até 6x sem juros.'
        }
      />
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <nav className="text-xs text-muted">
          Início / <span className="text-foreground">Produtos</span>
        </nav>
        <h1 className="font-display text-3xl text-foreground">Produtos</h1>
        {!isLoading && !errorMessage && (
          <p className="text-sm text-muted">
            {total} {total === 1 ? 'produto' : 'produtos'}
          </p>
        )}
      </header>

      <div className="mt-8 flex gap-10">
        <aside className="hidden w-64 shrink-0 lg:block">
          <CatalogFilters {...filterProps} />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-6 lg:hidden">
            <Button variant="secondary" size="sm" onClick={() => setDrawerOpen(true)}>
              <FiFilter size={16} />
              Filtrar
              {hasActiveFilters && <span className="text-accent"> •</span>}
            </Button>
          </div>

          {isLoading ? (
            <ProductGridSkeleton count={PAGE_SIZE_HINT} />
          ) : errorMessage ? (
            <ErrorState
              message={errorMessage}
              action={
                <Button variant="secondary" size="sm" onClick={reload}>
                  Tentar de novo
                </Button>
              }
            />
          ) : list.length === 0 ? (
            <EmptyState
              title="Nenhum produto encontrado"
              description="Tente ajustar os filtros ou limpar a busca."
              action={
                hasActiveFilters ? (
                  <Button variant="secondary" size="sm" onClick={clear}>
                    Limpar filtros
                  </Button>
                ) : null
              }
            />
          ) : (
            <>
              <ProductGrid products={list} />
              <Pagination
                className="mt-12"
                page={filters.page}
                totalPages={totalPages}
                onChange={setPage}
              />
            </>
          )}
        </div>
      </div>

      <FiltersDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} {...filterProps} />
    </Container>
  );
}
