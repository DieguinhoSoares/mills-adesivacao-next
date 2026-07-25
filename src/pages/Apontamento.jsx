import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadEvidencia } from '../cloudinary';
import { useFrotas } from '../hooks/useFrotas';
import { StatusPill } from '../components/StatusPill';
import { STATUS } from '../utils/statusFlow';
import { MANUAIS_ADESIVACAO } from '../utils/materiais';

// Acesso via link fixo: /apontamento/:token
// O token identifica a unidade; quem tira a foto é o técnico.
// Sem login — a segurança vem do token ser um UUID não adivinhável,
// combinado com as Firestore Rules restringindo escrita por essa via.
export default function Apontamento() {
  const { token } = useParams();
  const [unidade, setUnidade] = useState(null);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');
  const [fotoSelecionada, setFotoSelecionada] = useState(null);
  const [frotaAberta, setFrotaAberta] = useState(null);
  const [observacao, setObservacao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);
  const [sucesso, setSucesso] = useState(false);
  const { frotas, apontar } = useFrotas();

  useEffect(() => {
    async function resolverToken() {
      const q = query(collection(db, 'unidades'), where('tokenApontamento', '==', token));
      const snap = await getDocs(q);
      if (snap.empty) {
        setErro('Link inválido ou expirado.');
        return;
      }
      setUnidade({ id: snap.docs[0].id, ...snap.docs[0].data() });
    }
    resolverToken();
  }, [token]);

  const minhasFrotas = useMemo(() => {
    if (!unidade) return [];
    return frotas
      .filter((f) => f.unidadeId === unidade.id)
      .filter((f) => !busca || `${f.idNext}${f.numeroInterno}${f.numeroSerie}`.toLowerCase().includes(busca.toLowerCase()));
  }, [frotas, unidade, busca]);

  const feitas = minhasFrotas.filter((f) => f.status !== STATUS.PENDENTE).length;

  if (erro) return <p style={{ padding: '1rem', fontSize: 14, color: 'var(--text-danger)' }}>{erro}</p>;
  if (!unidade) return <p style={{ padding: '1rem', fontSize: 14, color: 'var(--text-secondary)' }}>Carregando…</p>;

  function fecharSheet() {
    setFrotaAberta(null);
    setFotoSelecionada(null);
    setObservacao('');
    setErroEnvio(null);
  }

  async function confirmarApontamento() {
    if (!fotoSelecionada || !frotaAberta) return;
    setEnviando(true);
    setErroEnvio(null);
    try {
      const fotoURL = await uploadEvidencia(fotoSelecionada, { frotaId: frotaAberta.id });
      await apontar(frotaAberta.id, {
        fotoURL,
        apontadoPor: unidade.unidade,
        observacao,
      });
      setSucesso(true);
      setTimeout(() => {
        setSucesso(false);
        fecharSheet();
      }, 1500);
    } catch (e) {
      setErroEnvio('Não foi possível enviar a foto. Verifique sua conexão e tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 420, margin: '0 auto', padding: '1rem', paddingBottom: frotaAberta ? 380 : '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Apontamento de adesivação</p>
          <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{unidade.unidade}</p>
        </div>
        <span className="status-pill" style={{ background: 'var(--st-pendente-bg)', color: 'var(--st-pendente-fg)' }}>
          {feitas} de {minhasFrotas.length} feitas
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {MANUAIS_ADESIVACAO.map((m) => (
          <a
            key={m.url}
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 500,
              color: 'var(--mills-terracota)', background: 'var(--bg-accent)', borderRadius: 8,
              padding: '8px 12px',
            }}
          >
            📄 {m.label}
          </a>
        ))}
      </div>

      <input
        type="text"
        placeholder="Buscar nº interno, série ou ID Next"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ width: '100%', marginBottom: 12 }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {minhasFrotas.map((f) => {
          const reprovado = f.status === STATUS.PENDENTE && f.motivoRejeicao;
          return (
            <div
              key={f.id}
              onClick={() => f.status === STATUS.PENDENTE && setFrotaAberta(f)}
              style={{
                border: `0.5px solid ${reprovado ? 'var(--border-danger)' : 'var(--border)'}`,
                borderRadius: 10,
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                cursor: f.status === STATUS.PENDENTE ? 'pointer' : 'default',
                background: reprovado ? 'var(--card-danger)' : 'var(--surface-2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{f.idNext}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Interno {f.numeroInterno} · Série {f.numeroSerie}
                  </p>
                </div>
                <StatusPill status={f.status} reprovado={!!reprovado} />
              </div>
              {reprovado && (
                <p style={{ fontSize: 12, color: 'var(--text-danger)', margin: 0, fontStyle: 'italic' }}>
                  Motivo: {f.motivoRejeicao} — toque para reenviar
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom sheet de apontamento */}
      {frotaAberta && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,32,33,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{
            background: 'var(--surface-2)', borderRadius: '20px 20px 0 0', padding: 22,
            width: '100%', maxWidth: 420,
          }}>
            {sucesso ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-success)',
                  color: 'var(--text-success)', fontSize: 24, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 12px',
                }}>✓</div>
                <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Apontamento enviado!</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Aguardando validação da analista</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{frotaAberta.idNext}</p>
                  <button onClick={fecharSheet} style={{ border: 'none', fontSize: 18, padding: '2px 8px', color: 'var(--text-muted)' }}>✕</button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px' }}>
                  Interno {frotaAberta.numeroInterno} · Série {frotaAberta.numeroSerie}
                </p>

                {!fotoSelecionada ? (
                  <label style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 4, border: '1.5px dashed var(--border-strong)', borderRadius: 12,
                    padding: '28px 12px', marginBottom: 12, cursor: 'pointer', textAlign: 'center',
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>Tirar foto da máquina adesivada</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Toque para abrir a câmera</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => setFotoSelecionada(e.target.files?.[0] || null)}
                      style={{ display: 'none' }}
                    />
                  </label>
                ) : (
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <img
                      src={URL.createObjectURL(fotoSelecionada)}
                      alt="Prévia da evidência"
                      style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12 }}
                    />
                    <button
                      onClick={() => setFotoSelecionada(null)}
                      style={{
                        position: 'absolute', top: 8, right: 8, border: 'none',
                        background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: '50%',
                        width: 28, height: 28, padding: 0, fontSize: 14,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                <textarea
                  placeholder="Observação (opcional)"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  style={{ width: '100%', minHeight: 60, marginBottom: 12 }}
                />
                {erroEnvio && (
                  <p style={{ fontSize: 12, color: 'var(--text-danger)', margin: '0 0 10px' }}>{erroEnvio}</p>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
                  <button onClick={fecharSheet}>Cancelar</button>
                  <button
                    disabled={!fotoSelecionada || enviando}
                    onClick={confirmarApontamento}
                    style={{
                      border: 'none', fontWeight: 600,
                      background: !fotoSelecionada || enviando ? '#D9D6C4' : 'var(--mills-laranja)',
                      color: '#fff',
                    }}
                  >
                    {enviando ? 'Enviando…' : 'Confirmar adesivação'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
