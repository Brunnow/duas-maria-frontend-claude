import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Container from '@/components/ui/Container';
import Spinner from '@/components/ui/Spinner';
import { selectAuth } from '@/features/auth/authSlice';

/*
 * Protege rotas privadas. Enquanto a sessao nao foi verificada, mostra um
 * estado de carregamento (evita "piscar" a tela de login). Sem sessao,
 * redireciona para /login guardando a rota pretendida em state.from.
 */
const LOGIN_MESSAGES = {
  '/checkout': 'Entre ou crie sua conta para finalizar a compra. Seu carrinho fica guardado.',
};

export default function ProtectedRoute() {
  const { status } = useSelector(selectAuth);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return (
      <Container className="flex justify-center py-24 text-muted">
        <Spinner className="size-6" />
      </Container>
    );
  }

  if (status !== 'authenticated') {
    const message = LOGIN_MESSAGES[location.pathname];
    return (
      <Navigate to="/login" replace state={{ from: location, ...(message ? { message } : {}) }} />
    );
  }

  return <Outlet />;
}
