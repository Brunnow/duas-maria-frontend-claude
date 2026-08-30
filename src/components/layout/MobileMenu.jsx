import { NavLink } from 'react-router-dom';
import Drawer from '@/components/ui/Drawer';
import { cn } from '@/lib/cn';

/** Menu de navegacao para telas pequenas (drawer lateral esquerdo). */
export default function MobileMenu({ open, onClose, nav }) {
  return (
    <Drawer open={open} onClose={onClose} side="left" title="Menu">
      <nav className="flex flex-col">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'border-b border-border py-3 text-sm tracking-wide text-muted transition-colors hover:text-foreground',
                isActive && 'text-foreground',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </Drawer>
  );
}
