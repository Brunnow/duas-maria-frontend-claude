import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FiMenu, FiSearch, FiShoppingBag, FiUser } from 'react-icons/fi';
import Container from '@/components/ui/Container';
import { cn } from '@/lib/cn';
import MobileMenu from './MobileMenu';

const nav = [
  { label: 'Início', to: '/' },
  { label: 'Produtos', to: '/produtos' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <Link
            to="/login"
            aria-label="Minha conta"
            className="rounded-control p-2 text-foreground transition-colors hover:bg-subtle"
          >
            <FiUser size={20} />
          </Link>
          <Link
            to="/carrinho"
            aria-label="Carrinho"
            className="relative rounded-control p-2 text-foreground transition-colors hover:bg-subtle"
          >
            <FiShoppingBag size={20} />
            {/* O contador de itens entra na fase Carrinho */}
          </Link>
        </div>
      </Container>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} nav={nav} />
    </header>
  );
}
