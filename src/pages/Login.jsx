import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

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
    <form onSubmit={entrar} style={{ maxWidth: 320, margin: '4rem auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 16, fontWeight: 500, margin: '0 0 8px' }}>Acesso do analista</p>
      <input type="email" placeholder="nome@mills.com.br" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} />
      {erro && <p style={{ fontSize: 12, color: 'var(--text-danger)', margin: 0 }}>{erro}</p>}
      <button type="submit" style={{ background: 'var(--fill-accent)', color: 'var(--on-accent)', border: 'none' }}>
        Entrar
      </button>
    </form>
  );
}
