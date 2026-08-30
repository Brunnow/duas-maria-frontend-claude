import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Home from '@/components/home/Home';
import Products from '@/components/products/Products';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/produtos" element={<Products />} />
          {/* Rota antiga em ingles -> redireciona para a versao pt-BR */}
          <Route path="/products" element={<Navigate to="/produtos" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
