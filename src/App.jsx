import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation, useOutletContext, Outlet } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { FrotasProvider, useFrotasContext } from './contexts/FrotasContext';
import { UnidadesProvider } from './contexts/UnidadesContext';
import { STATUS } from './utils/statusFlow';
import { MANUAIS_ADESIVACAO } from './utils/materiais';
import { AlterarSenhaModal } from './components/AlterarSenhaModal';

import Apontamento from './pages/Apontamento';
import ValidacaoAnalista from './pages/ValidacaoAnalista';
import Atribuicao from './pages/Atribuicao';
import Cronograma from './pages/Cronograma';
import Dashboard from './pages/Dashboard';
import Frotas from './pages/Frotas';
import Links from './pages/Links';
import Demo from './pages/Demo';
import Login from './pages/Login';

// Telas dentro da área interna pegam o e-mail do usuário logado por aqui,
// em vez de receber como prop — assim a página não remonta quando o pai muda.
export function useUsuarioAtual() {
  return useOutletContext();
}

function iniciais(email) {
  const nome = (email || '').split('@')[0];
  const partes = nome.split(/[._-]/).filter(Boolean);
  return partes.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
}

function Sidebar({ user }) {
  const { frotas } = useFrotasContext();
  const aguardando = frotas.filter((f) => f.status === STATUS.AGUARDANDO_ATRIBUICAO).length;
  const filaAnalista = frotas.filter((f) => f.status === STATUS.PENDENTE_VALIDACAO_ANALISTA).length;
  const [alterandoSenha, setAlterandoSenha] = useState(false);

  const itens = [
    { to: '/', label: 'Dashboard' },
    { to: '/cronograma', label: 'Cronograma' },
    { to: '/frotas', label: 'Frotas' },
    { to: '/atribuicao', label: 'Atribuição', badge: aguardando },
    { to: '/validacao', label: 'Validação', badge: filaAnalista },
    { to: '/links', label: 'Links' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand" style={{ padding: '0 14px', marginBottom: 20 }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: -0.3 }}>mills</span>
        <p style={{ fontSize: 11.5, color: 'var(--mills-verde-claro)', margin: '2px 0 0' }}>Adesivação NEXT</p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {itens.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' ativo' : ''}`}>
            <span>{item.label}</span>
            {item.badge > 0 && <span className="sidebar-badge">{item.badge}</span>}
          </NavLink>
        ))}
      </nav>

      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: '10px 14px 2px' }}>📄 Manuais de aplicação</p>
      {MANUAIS_ADESIVACAO.map((m) => (
        <a
          key={m.url}
          href={m.url}
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-link"
          style={{ fontSize: 12 }}
        >
          <span>{m.label}</span>
        </a>
      ))}

      <div className="sidebar-divisor" style={{ borderTop: '0.5px solid rgba(255,255,255,0.12)', margin: '16px 0' }} />
      <p className="sidebar-secao" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', margin: '0 14px 6px' }}>
        Telas de campo · sem login
      </p>
      <span className="sidebar-link sidebar-secao" style={{ cursor: 'default' }}>Apontamento</span>

      <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 30, height: 30, borderRadius: '50%', background: 'var(--mills-verde-claro)',
          color: 'var(--mills-verde-escuro)', fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {iniciais(user?.email)}
        </span>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 12, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </p>
          <span style={{ display: 'flex', gap: 8 }}>
            <span onClick={() => setAlterandoSenha(true)} style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', cursor: 'pointer' }}>
              Alterar senha
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
            <span onClick={() => signOut(auth)} style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', cursor: 'pointer' }}>
              Sair
            </span>
          </span>
        </div>
      </div>

      {alterandoSenha && <AlterarSenhaModal onClose={() => setAlterandoSenha(false)} />}
    </aside>
  );
}

// Layout persistente da área interna: monta UMA vez por sessão logada (não a
// cada navegação), então os listeners de frotas/unidades (Frotas/UnidadesProvider)
// também ficam abertos uma vez só, em vez de reabrir a cada clique no menu.
function AreaInternaLayout() {
  const [user, setUser] = useState(undefined);
  const location = useLocation();

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  if (user === undefined) return <p style={{ padding: '1rem', fontSize: 14, color: 'var(--text-secondary)' }}>Carregando…</p>;
  if (!user) return <Login />;

  return (
    <FrotasProvider>
      <UnidadesProvider>
        <div className="app-shell">
          <Sidebar user={user} />
          <main className="main-content">
            <div key={location.pathname} className="fade-in">
              <Outlet context={user.email} />
            </div>
          </main>
        </div>
      </UnidadesProvider>
    </FrotasProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.PROD ? '/mills-adesivacao-next' : '/'}>
      <Routes>
        {/* Demo: tela de apontamento sem precisar de login ou Firestore */}
        <Route path="/demo" element={<Demo />} />

        {/* Acesso por link fixo, sem login: quem está em campo tira a foto */}
        <Route path="/apontamento/:token" element={<Apontamento />} />

        {/* Área interna, com login: analista de frotas */}
        <Route element={<AreaInternaLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cronograma" element={<Cronograma />} />
          <Route path="/frotas" element={<Frotas />} />
          <Route path="/atribuicao" element={<Atribuicao />} />
          <Route path="/validacao" element={<ValidacaoAnalista />} />
          <Route path="/links" element={<Links />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
