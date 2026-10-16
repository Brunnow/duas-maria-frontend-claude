import { useCallback, useEffect, useState } from 'react';
import { FiChevronRight } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import { useFetch } from '@/hooks/useFetch';
import ProductVariantsManager from '@/components/admin/ProductVariantsManager';
import * as adminService from '@/services/adminService';

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;

/*
 * Visão de estoque por produto. A gestão da grade (tamanhos, estoque,
 * movimentações) é o mesmo componente usado na tela de produto —
 * aqui só escolhemos qual produto.
 *
 * A escolha é por busca + lista paginada (e não um select com "todos"):
 * o select pedia 200 produtos de uma vez e, a partir do 201º, o produto
 * simplesmente não aparecia.
 */
export default function AdminEstoque() {
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null); // produto escolhido

  // Busca enquanto digita, sem uma requisição por tecla.
  useEffect(() => {
    const next = draft.trim();
    if (next === query) return undefined;
    const timer = setTimeout(() => {
      setQuery(next);
      setPage(1);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft, query]);

  const fetcher = useCallback(
    () =>
      adminService.listProducts({
        pageNumber: page - 1,
        pageSize: PAGE_SIZE,
        sortBy: 'productName',
        sortOrder: 'asc',
        keyword: query || undefined,
      }),
    [page, query],
  );
  const { status, data, error, refetch } = useFetch(fetcher, [page, query]);
  const products = data?.content || [];
  const totalPages = data?.totalPages || 0;

  const changeProduct = () => {
    setSelected(null);
    refetch(); // o estoque total exibido na lista pode ter mudado
  };

  return (
    <div>
      <h2 className="font-display text-xl text-foreground">Estoque</h2>

      {selected ? (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border px-4 py-3">
            <p className="min-w-0 text-sm text-foreground">
              <span className="text-muted">Produto: </span>
              <span className="break-words">{selected.productName}</span>
            </p>
            <Button variant="secondary" size="sm" onClick={changeProduct}>
              Trocar produto
            </Button>
          </div>
          <div className="mt-6">
            <ProductVariantsManager key={selected.productId} productId={selected.productId} />
          </div>
        </>
      ) : (
        <>
          <div className="mt-4 max-w-md" role="search">
            <Input
              label="Buscar produto"
              type="search"
              placeholder="Nome do produto"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </div>

          <div className="mt-4">
            {status === 'loading' ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : status === 'error' ? (
              <ErrorState
                message={error}
                action={
                  <Button variant="secondary" size="sm" onClick={refetch}>
                    Tentar novamente
                  </Button>
                }
              />
            ) : products.length === 0 ? (
              <EmptyState
                title={query ? 'Nenhum produto encontrado' : 'Nenhum produto'}
                description={
                  query ? `Nenhum produto com “${query}” no nome.` : 'Crie produtos em Produtos.'
                }
              />
            ) : (
              <ul className="divide-y divide-border border-y border-border">
                {products.map((product) => (
                  <li key={product.productId}>
                    <button
                      type="button"
                      onClick={() => setSelected(product)}
                      className="flex w-full items-center gap-3 px-1 py-3 text-left transition-colors hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-foreground">
                          {product.productName}
                        </span>
                        <span className="block text-xs text-muted">
                          estoque {product.stock ?? 0}
                        </span>
                      </span>
                      <FiChevronRight className="shrink-0 text-muted" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Pagination className="mt-6" page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
