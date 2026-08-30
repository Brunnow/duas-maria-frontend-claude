import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Container from '@/components/ui/Container';
import Spinner from '@/components/ui/Spinner';
import { selectAuth } from '@/features/auth/authSlice';

/*
 * Guarda das rotas /admin/*. Exige sessao E o papel ROLE_ADMIN.
 * Sem sessao -> /login (guarda a rota). Autenticado sem o papel -> home.
 */
export default function AdminRoute() {
  const { status, roles } = useSelector(selectAuth);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return (
      <Container className="flex justify-center py-24 text-muted">
        <Spinner className="size-6" />
      </Container>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!roles.includes('ROLE_ADMIN')) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
