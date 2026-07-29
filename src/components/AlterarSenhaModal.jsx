import { useState } from 'react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '../firebase';

export function AlterarSenhaModal({ onClose }) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e) {
    e.preventDefault();
    setErro(null);

    if (novaSenha.length < 6) {
      setErro('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmar) {
      setErro('A confirmação não confere com a nova senha.');
      return;
    }

    setSalvando(true);
    try {
      const user = auth.currentUser;
      const credencial = EmailAuthProvider.credential(user.email, senhaAtual);
      await reauthenticateWithCredential(user, credencial);
      await updatePassword(user, novaSenha);
      setSucesso(true);
    } catch (e) {
      setErro(
        e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password'
          ? 'Senha atual incorreta.'
          : 'Não foi possível alterar a senha. Tente novamente.'
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,32,33,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
      <div style={{ background: 'var(--surface-2)', borderRadius: 16, padding: 24, width: '90%', maxWidth: 380 }}>
        {sucesso ? (
          <>
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>Senha alterada!</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              Da próxima vez, use a nova senha para entrar.
            </p>
            <button
              onClick={onClose}
              style={{ width: '100%', background: 'var(--mills-laranja)', color: '#fff', border: 'none', fontWeight: 600, padding: 10 }}
            >
              Fechar
            </button>
          </>
        ) : (
          <form onSubmit={salvar}>
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px' }}>Alterar senha</p>

            <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Senha atual
            </label>
            <input
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              required
              style={{ width: '100%', marginBottom: 12 }}
            />

            <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Nova senha
            </label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
              style={{ width: '100%', marginBottom: 12 }}
            />

            <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Confirmar nova senha
            </label>
            <input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
              style={{ width: '100%', marginBottom: 14 }}
            />

            {erro && <p style={{ fontSize: 12, color: 'var(--text-danger)', margin: '0 0 12px' }}>{erro}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
              <button
                type="submit"
                disabled={salvando}
                style={{ flex: 1, background: 'var(--mills-laranja)', color: '#fff', border: 'none', fontWeight: 600 }}
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
