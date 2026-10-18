import { useEffect } from 'react';

/**
 * Enquanto `active` (ex.: a tela está mostrando um erro de carregamento),
 * chama `retry` quando a página volta a ficar visível. Cobre o app do Google
 * no iPhone, que pré-carrega a página em segundo plano e corta a conexão:
 * quando a cliente de fato abre o site, a busca é refeita sozinha.
 */
export function useRetryWhenVisible(active, retry) {
  useEffect(() => {
    if (!active) return undefined;
    const onVisible = () => {
      if (document.visibilityState === 'visible') retry();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onVisible);
    };
  }, [active, retry]);
}

export default useRetryWhenVisible;
