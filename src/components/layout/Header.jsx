import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FiMenu, FiSearch, FiShoppingBag } from 'react-icons/fi';
import Container from '@/components/ui/Container';
import { logout, selectAuth } from '@/features/auth/authSlice';
import { openDrawer, selectCartCount } from '@/features/cart/cartSlice';
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

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <Container className="grid h-16 grid-cols-[1fr_auto_1fr] items-center lg:h-20">
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

        {/* Centro: wordmark (placeholder ate haver arte de logo) */}
        <Link
          to="/"
          className="justify-self-center font-display text-2xl tracking-wide text-foreground lg:text-[28px]"
        >
          Duas Marias
        </Link>

        {/* Direita: acoes */}
        <div className="flex items-center gap-1 justify-self-end sm:gap-2">
          <button
            type="button"
            aria-label="Buscar"
            className="rounded-control p-2 text-foreground transition-colors hover:bg-subtle"
          >
            <FiSearch size={20} />
          </button>
          {isAuthenticated ? (
            <UserMenu username={user?.username} />
          ) : (
            <Link
              to="/login"
              className="rounded-control px-3 py-2 text-sm text-foreground transition-colors hover:bg-subtle"
            >
              Entrar
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
        auth={{ isAuthenticated, onLogout: handleLogout }}
      />
    </header>
  );
}
