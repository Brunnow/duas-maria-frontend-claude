import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { onUnauthorized } from '@/api/api';
import Layout from '@/components/layout/Layout';
import Home from '@/components/home/Home';
import Catalogo from '@/pages/Catalogo';
import Produto from '@/pages/Produto';
import Login from '@/pages/Login';
import Cadastro from '@/pages/Cadastro';
import NotFound from '@/pages/NotFound';
import { bootstrapSession, sessionExpired } from '@/features/auth/authSlice';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(bootstrapSession());
    return onUnauthorized(() => dispatch(sessionExpired()));
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/produtos" element={<Catalogo />} />
          <Route path="/produtos/:id" element={<Produto />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          {/* Rota antiga em ingles -> redireciona para a versao pt-BR */}
          <Route path="/products" element={<Navigate to="/produtos" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
