import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Ao abrir outra página pelo site (link, botão), começa do topo. Sem isto a
 * troca de página da SPA mantinha a rolagem da página anterior: clicar num
 * produto no fim da Home abria o produto já na descrição ou no rodapé.
 * Voltar/avançar do navegador (POP) não mexe na rolagem, e mudar só filtros
 * da URL (?page, ?category) também não — ali a página é a mesma.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [pathname, navigationType]);

  return null;
}
