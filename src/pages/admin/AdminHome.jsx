import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import * as adminService from '@/services/adminService';

const LOW_THRESHOLD = 3;

export default function AdminHome() {
  const [state, setState] = useState({ status: 'loading', low: [] });

  useEffect(() => {
    adminService
      .getLowStock(LOW_THRESHOLD)
      .then((low) => setState({ status: 'ready', low: Array.isArray(low) ? low : [] }))
      .catch(() => setState({ status: 'error', low: [] }));
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="font-display text-xl text-foreground">Visão geral</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link
            to="/admin/produtos"
            className="rounded-card border border-border p-4 text-sm transition-colors hover:border-foreground/30"
          >
            <span className="block text-foreground">Produtos</span>
            <span className="text-muted">Criar, editar, imagem</span>
          </Link>
          <Link
            to="/admin/categorias"
            className="rounded-card border border-border p-4 text-sm transition-colors hover:border-foreground/30"
          >
            <span className="block text-foreground">Categorias</span>
            <span className="text-muted">Organizar o catálogo</span>
          </Link>
          <Link
            to="/admin/estoque"
            className="rounded-card border border-border p-4 text-sm transition-colors hover:border-foreground/30"
          >
            <span className="block text-foreground">Estoque</span>
            <span className="text-muted">Grade de tamanhos e saldo</span>
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Estoque baixo (≤ {LOW_THRESHOLD})
          </h3>
          <Button as={Link} to="/admin/estoque" variant="ghost" size="sm">
            Ir para Estoque
          </Button>
        </div>

        {state.status === 'loading' ? (
          <Skeleton className="mt-3 h-24" />
        ) : state.status === 'error' ? (
          <p className="mt-3 text-sm text-muted">Não foi possível carregar o estoque baixo.</p>
        ) : state.low.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nenhuma variação com estoque baixo.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {state.low.map((variant) => (
              <li
                key={variant.variantId}
                className="flex items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="truncate text-muted">
                  {variant.sku} · tam. {variant.size}
                </span>
                <span className={variant.stock === 0 ? 'font-medium text-danger' : 'text-warning'}>
                  {variant.stock}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
