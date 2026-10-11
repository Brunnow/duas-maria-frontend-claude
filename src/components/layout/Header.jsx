import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FiMenu, FiShoppingBag, FiUser } from 'react-icons/fi';
import Container from '@/components/ui/Container';
import { logout, selectAuth } from '@/features/auth/authSlice';
import { openDrawer, selectCartCount } from '@/features/cart/cartSlice';
import { fetchCategories } from '@/store/actions';
import { cn } from '@/lib/cn';
import MobileMenu from './MobileMenu';
import UserMenu from './UserMenu';

const nav = [
  { label: 'Início', to: '/' },
  { label: 'Produtos', to: '/produtos' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, user } = useSelector(selectAuth);
  const isAuthenticated = status === 'authenticated';
  const cartCount = useSelector(selectCartCount);
  const categories = useSelector((state) => state.products.categories);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <Container className="grid h-16 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 lg:h-20">
        {/* Esquerda: menu mobile + navegacao desktop */}
        <div className="flex items-center gap-6 justify-self-start">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            className="rounded-control p-1 text-foreground transition-colors hover:bg-subtle lg:hidden"
          >
            <FiMenu size={22} />
          </button>
          <nav className="hidden items-center gap-6 lg:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'text-sm tracking-wide text-muted transition-colors hover:text-foreground',
                    isActive && 'text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Centro: wordmark */}
        <Link
          to="/"
          className="justify-self-center whitespace-nowrap font-display text-xl tracking-wide text-foreground sm:text-2xl lg:text-[28px]"
        >
          Duas Maria
        </Link>

        {/* Direita: acoes */}
        <div className="flex items-center gap-1 justify-self-end sm:gap-2">
          {isAuthenticated ? (
            <UserMenu username={user?.username} />
          ) : (
            <Link
              to="/login"
              aria-label="Entrar"
              className="rounded-control p-2 text-sm text-foreground transition-colors hover:bg-subtle sm:px-3"
            >
              <FiUser size={20} aria-hidden="true" className="sm:hidden" />
              <span className="hidden sm:inline">Entrar</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => dispatch(openDrawer())}
            aria-label={
              cartCount > 0
                ? `Carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`
                : 'Carrinho'
            }
            className="relative rounded-control p-2 text-foreground transition-colors hover:bg-subtle"
          >
            <FiShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-fg">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
        </div>
      </Container>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        nav={nav}
        categories={categories || []}
        auth={{ isAuthenticated, username: user?.username, onLogout: handleLogout }}
      />
    </header>
  );
}
