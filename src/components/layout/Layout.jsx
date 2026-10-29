import { Outlet } from 'react-router-dom';
import CartDrawer from '@/components/cart/CartDrawer';
import AnnouncementBar from './AnnouncementBar';
import FloatingWhatsApp from './FloatingWhatsApp';
import Footer from './Footer';
import Header from './Header';
import LaunchPromo from './LaunchPromo';

/**
 * Casca comum a todas as rotas: header fixo, conteudo, footer e o drawer do carrinho.
 * --buy-bar-h: altura da barra de compra fixa da pagina de produto no celular
 * (0 fora dela) — reserva o espaco no fim e sobe os botoes flutuantes.
 */
export default function Layout() {
  return (
    <div className="flex min-h-dvh flex-col pb-[var(--buy-bar-h,0px)]">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <FloatingWhatsApp />
      <LaunchPromo />
    </div>
  );
}
