import { NavLink } from 'react-router-dom';
import Drawer from '@/components/ui/Drawer';
import { cn } from '@/lib/cn';

const linkClass = ({ isActive }) =>
  cn(
    'block border-b border-border py-3 text-sm tracking-wide text-muted transition-colors hover:text-foreground',
    isActive && 'text-foreground',
  );

/** Menu de navegacao para telas pequenas (drawer lateral esquerdo). */
export default function MobileMenu({ open, onClose, nav, auth }) {
  return (
    <Drawer open={open} onClose={onClose} side="left" title="Menu">
      <nav className="flex flex-col">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onClose}
            className={linkClass}
          >
            {item.label}
          </NavLink>
        ))}

        <div className="mt-4 border-t border-border pt-2">
          {auth.isAuthenticated ? (
            <>
              <NavLink to="/conta" onClick={onClose} className={linkClass}>
                Minha conta
              </NavLink>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  auth.onLogout();
                }}
                className="block w-full py-3 text-left text-sm tracking-wide text-danger"
              >
                Sair
              </button>
            </>
          ) : (
            <NavLink to="/login" onClick={onClose} className={linkClass}>
              Entrar
            </NavLink>
          )}
        </div>
      </nav>
    </Drawer>
  );
}
