import { NavLink, Outlet } from 'react-router-dom';
import Container from '@/components/ui/Container';
import { cn } from '@/lib/cn';

const NAV = [
  { to: '/admin', label: 'Visão geral', end: true },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/produtos', label: 'Produtos' },
  { to: '/admin/categorias', label: 'Categorias' },
  { to: '/admin/estoque', label: 'Estoque' },
  { to: '/admin/cupons', label: 'Cupons' },
  { to: '/admin/remetente', label: 'Remetente' },
];

export default function AdminLayout() {
  return (
    <Container className="py-10 lg:py-14">
      <h1 className="font-display text-3xl text-foreground">Administração</h1>

      <div className="mt-6 flex gap-8 max-lg:flex-col">
        <nav className="flex flex-wrap gap-1 lg:w-48 lg:flex-col">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'rounded-control px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-accent-fg'
                    : 'text-muted hover:bg-subtle hover:text-foreground',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </Container>
  );
}
