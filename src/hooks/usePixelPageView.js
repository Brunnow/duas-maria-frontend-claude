import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/pixel';

// Última entrada do histórico já contada. Fica fora do componente para o
// StrictMode (que roda o efeito duas vezes em dev) não contar a mesma página
// duas vezes.
let lastTrackedKey = null;

/**
 * PageView do Pixel a cada troca de página da SPA, inclusive a primeira
 * carga (o initPixel não dispara PageView sozinho). Só o caminho conta:
 * filtros na URL (?page, ?cor) não são página nova. O admin fica de fora
 * para não misturar a navegação da equipe com a das clientes.
 */
export function usePixelPageView() {
  const { pathname, key } = useLocation();

  useEffect(() => {
    if (key === lastTrackedKey) return;
    lastTrackedKey = key;
    if (pathname === '/admin' || pathname.startsWith('/admin/')) return;
    trackPageView();
    // `key` muda a cada navegação; só a troca de caminho deve disparar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
}
