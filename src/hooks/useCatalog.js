import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts } from '@/store/actions';

/*
 * Fonte unica de verdade dos filtros do catalogo.
 *
 * Le e escreve os parametros da URL (page, category, sortby, keyword) e,
 * a cada mudanca, dispara o fetch de produtos com a query esperada pelo
 * backend (pageNumber 0-based, sortBy=price, sortOrder, category, keyword).
 *
 * Os nomes dos parametros da URL sao mantidos identicos aos da versao
 * anterior para nao quebrar links existentes.
 */

const DEFAULT_SORT = 'asc';

export function useCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();

  const filters = useMemo(
    () => ({
      page: Number(searchParams.get('page')) || 1,
      category: searchParams.get('category') || '',
      sort: searchParams.get('sortby') || DEFAULT_SORT,
      keyword: searchParams.get('keyword') || '',
    }),
    [searchParams],
  );

  const update = useCallback(
    (patch) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value == null || value === '' || (key === 'page' && Number(value) <= 1)) {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        }
        // Qualquer mudanca de filtro (que nao seja a propria pagina) volta para a pagina 1.
        if (!('page' in patch)) next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

  const setCategory = useCallback((category) => update({ category }), [update]);
  const setSort = useCallback((sort) => update({ sortby: sort }), [update]);
  const setKeyword = useCallback((keyword) => update({ keyword }), [update]);
  const setPage = useCallback((page) => update({ page }), [update]);
  const clear = useCallback(() => setSearchParams(new URLSearchParams()), [setSearchParams]);

  useEffect(() => {
    const query = new URLSearchParams();
    query.set('pageNumber', String(filters.page - 1));
    query.set('sortBy', 'price');
    query.set('sortOrder', filters.sort);
    if (filters.category) query.set('category', filters.category);
    if (filters.keyword) query.set('keyword', filters.keyword);

    dispatch(fetchProducts(query.toString()));
  }, [dispatch, filters.page, filters.category, filters.sort, filters.keyword]);

  return { filters, setCategory, setSort, setKeyword, setPage, clear };
}

export default useCatalog;
