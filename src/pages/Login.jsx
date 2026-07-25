import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const labelStyle = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--text-muted)',
  display: 'block',
  marginBottom: 4,
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);

  async function entrar(e) {
    e.preventDefault();
    setErro(null);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
    } catch {
      setErro('E-mail ou senha incorretos.');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--mills-pardo)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <form
        onSubmit={entrar}
        style={{
          width: 380,
          maxWidth: '100%',
          background: 'var(--surface-2)',
          borderRadius: 16,
          padding: '40px 36px',
          boxShadow: '0 20px 50px rgba(0,64,66,0.12)',
        }}
      >
        <div style={{ width: 44, height: 4, background: 'var(--mills-laranja)', borderRadius: 2, marginBottom: 20 }} />
        <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--mills-verde-escuro)', margin: 0 }}>mills</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 24px' }}>Painel de Adesivação · Frota NEXT</p>

        <label style={labelStyle}>E-mail</label>
        <input
          type="email"
          placeholder="nome@mills.com.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', marginBottom: 14 }}
        />
        <label style={labelStyle}>Senha</label>
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={{ width: '100%', marginBottom: 14 }}
        />
        {erro && <p style={{ fontSize: 12, color: 'var(--text-danger)', margin: '0 0 12px' }}>{erro}</p>}
        <button
          type="submit"
          style={{
            width: '100%',
            background: 'var(--mills-laranja)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            border: 'none',
            padding: 12,
            marginBottom: 16,
          }}
        >
          Entrar
        </button>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
          Acesso restrito ao time de análise de frotas NEXT.
        </p>
      </form>
    </div>
  );
}
