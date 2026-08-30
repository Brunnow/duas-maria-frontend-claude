import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { onUnauthorized } from '@/api/api';
import Layout from '@/components/layout/Layout';
import Home from '@/components/home/Home';
import Catalogo from '@/pages/Catalogo';
import Produto from '@/pages/Produto';
import Login from '@/pages/Login';
import Cadastro from '@/pages/Cadastro';
import Carrinho from '@/pages/Carrinho';
import Conta from '@/pages/Conta';
import Pedidos from '@/pages/Pedidos';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { bootstrapSession, selectIsAuthenticated, sessionExpired } from '@/features/auth/authSlice';
import { clearCart, fetchCart } from '@/features/cart/cartSlice';
import { clearAddresses } from '@/features/address/addressSlice';

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    dispatch(bootstrapSession());
    return onUnauthorized(() => dispatch(sessionExpired()));
  }, [dispatch]);

  // Dados por usuario (carrinho, enderecos): carregam ao autenticar, limpam ao sair.
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    } else {
      dispatch(clearCart());
      dispatch(clearAddresses());
    }
  }, [isAuthenticated, dispatch]);

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/produtos" element={<Catalogo />} />
          <Route path="/produtos/:id" element={<Produto />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/carrinho" element={<Carrinho />} />
            <Route path="/conta" element={<Conta />} />
            <Route path="/pedidos" element={<Pedidos />} />
          </Route>
          {/* Rota antiga em ingles -> redireciona para a versao pt-BR */}
          <Route path="/products" element={<Navigate to="/produtos" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
