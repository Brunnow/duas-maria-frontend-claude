import { Outlet } from 'react-router-dom';
import CartDrawer from '@/components/cart/CartDrawer';
import Footer from './Footer';
import Header from './Header';

/** Casca comum a todas as rotas: header fixo, conteudo, footer e o drawer do carrinho. */
export default function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
