import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import Apontamento from './pages/Apontamento';
import ValidacaoGestor from './pages/ValidacaoGestor';
import ValidacaoAnalista from './pages/ValidacaoAnalista';
import Atribuicao from './pages/Atribuicao';
import Dashboard from './pages/Dashboard';
import Frotas from './pages/Frotas';
import Links from './pages/Links';
import Demo from './pages/Demo';
import Login from './pages/Login';

function AreaInterna({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  if (user === undefined) return <p style={{ padding: '1rem', fontSize: 14, color: 'var(--text-secondary)' }}>Carregando…</p>;
  if (!user) return <Login />;
  return children(user);
}

function Nav() {
  const linkStyle = { fontWeight: 500 };
  return (
    <div
      className="nav-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '14px 20px',
        borderBottom: '0.5px solid var(--border)',
        fontSize: 13,
        background: 'var(--surface-2)',
      }}
    >
      <span style={{ color: 'var(--mills-verde-escuro)', fontWeight: 700, fontSize: 14, letterSpacing: -0.3 }}>mills</span>
      <Link to="/" style={linkStyle}>Dashboard</Link>
      <Link to="/frotas" style={linkStyle}>Frotas</Link>
      <Link to="/atribuicao" style={linkStyle}>Atribuição</Link>
      <Link to="/validacao" style={linkStyle}>Validação</Link>
      <Link to="/links" style={linkStyle}>Links</Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.PROD ? '/mills-adesivacao-next' : '/'}>
      <Routes>
        {/* Demo: tela de apontamento sem precisar de login ou Firestore */}
        <Route path="/demo" element={<Demo />} />

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
          path="/frotas"
          element={
            <>
              <Nav />
              <AreaInterna>{() => <Frotas />}</AreaInterna>
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
        <Route
          path="/links"
          element={
            <>
              <Nav />
              <AreaInterna>{() => <Links />}</AreaInterna>
            </>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
