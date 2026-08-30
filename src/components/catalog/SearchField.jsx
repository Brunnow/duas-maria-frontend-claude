import { useEffect, useState } from 'react';
import { FiSearch } from 'react-icons/fi';

const DEBOUNCE_MS = 500;

/**
 * Campo de busca com debounce. Mantem um estado local para digitacao
 * imediata e so propaga (onSearch) apos a pausa. Sincroniza com o valor
 * externo pelo padrao de "valor anterior" (sem efeito de setState).
 */
export default function SearchField({ value, onSearch }) {
  const [text, setText] = useState(value);
  const [lastExternal, setLastExternal] = useState(value);

  if (value !== lastExternal) {
    setLastExternal(value);
    setText(value);
  }

  useEffect(() => {
    if (text === value) return undefined;
    const id = setTimeout(() => onSearch(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [text, value, onSearch]);

  return (
    <div className="relative">
      <FiSearch
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        size={16}
      />
      <input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Buscar produtos"
        aria-label="Buscar produtos"
        className="h-11 w-full rounded-control border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      />
    </div>
  );
}
