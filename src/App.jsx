import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Home from '@/components/home/Home';
import Catalogo from '@/pages/Catalogo';
import Produto from '@/pages/Produto';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/produtos" element={<Catalogo />} />
          <Route path="/produtos/:id" element={<Produto />} />
          {/* Rota antiga em ingles -> redireciona para a versao pt-BR */}
          <Route path="/products" element={<Navigate to="/produtos" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
