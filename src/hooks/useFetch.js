import { useCallback, useEffect, useReducer, useState } from 'react';

const reducer = (state, action) => {
  switch (action.type) {
    case 'loading':
      return { ...state, status: 'loading', error: null };
    case 'success':
      return { status: 'ready', data: action.data, error: null };
    case 'error':
      return { status: 'error', data: state.data, error: action.error };
    default:
      return state;
  }
};

/*
 * Busca de dados com estado (status: 'loading' | 'ready' | 'error'),
 * `data`, `error` e `refetch()`. Estado local via useReducer (dispatch
 * dentro de efeito nao dispara o lint de setState-in-effect).
 *
 * `fetcher` deve ser estavel entre renders (defina fora do componente
 * ou com useCallback). `deps` re-executa a busca quando mudam.
 */
export function useFetch(fetcher, deps = []) {
  const [state, dispatch] = useReducer(reducer, { status: 'loading', data: null, error: null });
  const [attempt, setAttempt] = useState(0);

  const refetch = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    dispatch({ type: 'loading' });
    Promise.resolve(fetcher())
      .then((data) => {
        if (alive) dispatch({ type: 'success', data });
      })
      .catch((err) => {
        if (alive) {
          dispatch({
            type: 'error',
            error: err?.response?.data?.message || 'Não foi possível carregar os dados.',
          });
        }
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  return { ...state, refetch };
}

export default useFetch;
