import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import Apontamento from './pages/Apontamento';
import ValidacaoGestor from './pages/ValidacaoGestor';
import ValidacaoAnalista from './pages/ValidacaoAnalista';
import Atribuicao from './pages/Atribuicao';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

function AreaInterna({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  if (user === undefined) return <p style={{ padding: '1rem', fontSize: 14, color: 'var(--text-secondary)' }}>Carregando…</p>;
  if (!user) return <Login />;
  return children(user);
}

function Nav() {
  return (
    <div style={{ display: 'flex', gap: 16, padding: '12px 16px', borderBottom: '0.5px solid var(--border)', fontSize: 13 }}>
      <Link to="/">Dashboard</Link>
      <Link to="/atribuicao">Atribuição</Link>
      <Link to="/validacao">Validação</Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.PROD ? '/mills-adesivacao-next' : '/'}>
      <Routes>
        {/* Acesso por link fixo, sem login: gestor ou técnico em campo */}
        <Route path="/apontamento/:token" element={<Apontamento />} />
        <Route path="/validacao-gestor/:token" element={<ValidacaoGestor />} />

        {/* Área interna, com login: analista de frotas */}
        <Route
          path="/"
          element={
            <>
              <Nav />
              <AreaInterna>{() => <Dashboard />}</AreaInterna>
            </>
          }
        />
        <Route
          path="/atribuicao"
          element={
            <>
              <Nav />
              <AreaInterna>{(user) => <Atribuicao usuarioAtual={user.email} />}</AreaInterna>
            </>
          }
        />
        <Route
          path="/validacao"
          element={
            <>
              <Nav />
              <AreaInterna>{(user) => <ValidacaoAnalista usuarioAtual={user.email} />}</AreaInterna>
            </>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
