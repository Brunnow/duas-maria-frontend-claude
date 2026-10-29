import { useEffect, useState } from 'react';

const matches = (query, fallback) =>
  typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : fallback;

/**
 * A media query bate agora? Acompanha mudanças (girar o celular, redimensionar).
 * Sem matchMedia (testes em jsdom), devolve `fallback`.
 */
export function useMediaQuery(query, fallback = false) {
  const [value, setValue] = useState(() => matches(query, fallback));

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const list = window.matchMedia(query);
    const onChange = () => setValue(list.matches);
    onChange();
    list.addEventListener?.('change', onChange);
    return () => list.removeEventListener?.('change', onChange);
  }, [query]);

  return value;
}
