import { NavLink, useSearchParams } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';
import Drawer from '@/components/ui/Drawer';
import { cn } from '@/lib/cn';

const primaryLinkClass = ({ isActive }) =>
  cn(
    '-mx-2 flex items-center justify-between rounded-control px-2 py-3.5 text-[15px] font-semibold text-foreground transition-colors hover:bg-subtle',
    isActive && 'bg-subtle',
  );

const sectionLabelClass = 'px-2 pb-1.5 pt-5 text-[11px] font-medium uppercase tracking-wider text-muted';

const accountLinkClass = ({ isActive }) =>
  cn(
    '-mx-2 block rounded-control px-2 py-3 text-sm text-foreground transition-colors hover:bg-subtle',
    isActive && 'bg-subtle',
  );

/** Menu de navegacao para telas pequenas (drawer lateral esquerdo). */
export default function MobileMenu({ open, onClose, nav, categories, auth }) {
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || '';

  return (
    <Drawer open={open} onClose={onClose} side="left" title="Menu">
      <nav className="flex flex-col">
        {auth.isAuthenticated && auth.username && (
          <p className="mb-1 border-b border-border pb-3 text-xs text-muted">
            Olá, <span className="font-medium text-foreground">{auth.username}</span>
          </p>
        )}

        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={onClose} className={primaryLinkClass}>
            {item.label}
          </NavLink>
        ))}

        {categories.length > 0 && (
          <>
            <p className={sectionLabelClass}>Categorias</p>
            {categories.map((c) => {
              const isActive = c.categoryName === activeCategory;
              return (
                <NavLink
                  key={c.categoryId}
                  to={`/produtos?category=${encodeURIComponent(c.categoryName)}`}
                  onClick={onClose}
                  className={cn(
                    '-mx-2 flex items-center justify-between rounded-control px-2 py-3 text-[14.5px] transition-colors',
                    isActive ? 'bg-accent text-accent-fg' : 'text-foreground hover:bg-subtle',
                  )}
                >
                  {c.categoryName}
                  <FiChevronRight className={isActive ? 'text-accent-fg' : 'text-muted'} size={15} />
                </NavLink>
              );
            })}
          </>
        )}

        <p className={sectionLabelClass}>Conta</p>
        {auth.isAuthenticated ? (
          <>
            <NavLink to="/conta" onClick={onClose} className={accountLinkClass}>
              Minha conta
            </NavLink>
            <NavLink to="/pedidos" onClick={onClose} className={accountLinkClass}>
              Meus pedidos
            </NavLink>
            <button
              type="button"
              onClick={() => {
                onClose();
                auth.onLogout();
              }}
              className="-mx-2 block w-[calc(100%+1rem)] rounded-control px-2 py-3 text-left text-sm text-danger transition-colors hover:bg-subtle"
            >
              Sair
            </button>
          </>
        ) : (
          <NavLink to="/login" onClick={onClose} className={accountLinkClass}>
            Entrar
          </NavLink>
        )}
      </nav>
    </Drawer>
  );
}
