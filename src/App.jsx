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
import Checkout from '@/pages/Checkout';
import CheckoutRetorno from '@/pages/CheckoutRetorno';
import Conta from '@/pages/Conta';
import Pedidos from '@/pages/Pedidos';
import PedidoDetalhe from '@/pages/PedidoDetalhe';
import NotFound from '@/pages/NotFound';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHome from '@/pages/admin/AdminHome';
import AdminProdutos from '@/pages/admin/AdminProdutos';
import AdminCategorias from '@/pages/admin/AdminCategorias';
import AdminEstoque from '@/pages/admin/AdminEstoque';
import AdminPedidos from '@/pages/admin/AdminPedidos';
import AdminPedidoDetalhe from '@/pages/admin/AdminPedidoDetalhe';
import AdminCupons from '@/pages/admin/AdminCupons';
import AdminConfigRemetente from '@/pages/admin/AdminConfigRemetente';
import ProtectedRoute from '@/routes/ProtectedRoute';
import AdminRoute from '@/routes/AdminRoute';
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
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/retorno" element={<CheckoutRetorno />} />
            <Route path="/conta" element={<Conta />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/pedidos/:id" element={<PedidoDetalhe />} />
          </Route>
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminHome />} />
              <Route path="produtos" element={<AdminProdutos />} />
              <Route path="categorias" element={<AdminCategorias />} />
              <Route path="estoque" element={<AdminEstoque />} />
              <Route path="pedidos" element={<AdminPedidos />} />
              <Route path="pedidos/:id" element={<AdminPedidoDetalhe />} />
              <Route path="cupons" element={<AdminCupons />} />
              <Route path="remetente" element={<AdminConfigRemetente />} />
            </Route>
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
