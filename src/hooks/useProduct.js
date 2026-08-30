import { useCallback, useEffect, useReducer, useState } from 'react';
import { getProduct, getProductVariants } from '@/services/productService';

/*
 * Carrega os dados da Pagina de Produto: produto + variacoes em paralelo.
 * Estado local via useReducer (e uma tela, nao estado compartilhado).
 *
 * status: 'loading' | 'ready' | 'notfound' | 'error'
 */

const INITIAL = { status: 'loading', product: null, variants: [], error: null };

function reducer(state, action) {
  switch (action.type) {
    case 'loading':
      return { ...INITIAL };
    case 'ready':
      return {
        status: 'ready',
        product: action.product,
        variants: action.variants,
        error: null,
      };
    case 'notfound':
    case 'error':
      return { status: action.type, product: null, variants: [], error: action.error };
    default:
      return state;
  }
}

export function useProduct(productId) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'loading' });

    Promise.all([getProduct(productId), getProductVariants(productId)])
      .then(([product, variants]) => {
        if (cancelled) return;
        dispatch({
          type: 'ready',
          product,
          variants: Array.isArray(variants) ? variants : [],
        });
      })
      .catch((err) => {
        if (cancelled) return;
        dispatch({
          type: err?.response?.status === 404 ? 'notfound' : 'error',
          error: err?.response?.data?.message || 'Não foi possível carregar o produto.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [productId, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, reload };
}

export default useProduct;
