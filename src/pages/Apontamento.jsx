import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadEvidencia } from '../cloudinary';
import { useFrotas } from '../hooks/useFrotas';
import { STATUS, STATUS_LABEL } from '../utils/statusFlow';

// Acesso via link fixo: /apontamento/:token
// O token identifica a unidade (e implicitamente quem deve apontar:
// técnico ou gestor, conforme unidades.responsavelApontamento).
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

  async function confirmarApontamento() {
    if (!fotoSelecionada || !frotaAberta) return;
    setEnviando(true);
    try {
      const fotoURL = await uploadEvidencia(fotoSelecionada, { frotaId: frotaAberta.id });
      await apontar(frotaAberta.id, {
        fotoURL,
        apontadoPor: unidade.unidade,
        observacao,
        unidade,
      });
      setFrotaAberta(null);
      setFotoSelecionada(null);
      setObservacao('');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Apontamento de adesivação</p>
          <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>{unidade.unidade}</p>
        </div>
        <span style={{ background: 'var(--bg-accent)', color: 'var(--text-accent)', fontSize: 12, padding: '4px 10px', borderRadius: 'var(--radius)' }}>
          {feitas} de {minhasFrotas.length} feitas
        </span>
      </div>

      <input
        type="text"
        placeholder="Buscar nº interno, série ou ID Next"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ width: '100%', marginBottom: 12 }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {minhasFrotas.map((f) => (
          <div
            key={f.id}
            onClick={() => f.status === STATUS.PENDENTE && setFrotaAberta(f)}
            style={{
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '10px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: f.status === STATUS.PENDENTE ? 'pointer' : 'default',
            }}
          >
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{f.idNext}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Interno {f.numeroInterno} · Série {f.numeroSerie}
              </p>
            </div>
            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 'var(--radius)', background: 'var(--surface-1)', color: 'var(--text-secondary)' }}>
              {STATUS_LABEL[f.status]}
            </span>
          </div>
        ))}
      </div>

      {frotaAberta && (
        <div style={{ position: 'relative', minHeight: 320, background: 'rgba(0,0,0,0.45)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
          <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '1.25rem', width: '88%' }}>
            <p style={{ fontSize: 15, fontWeight: 500, margin: '0 0 4px' }}>{frotaAberta.idNext}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
              Interno {frotaAberta.numeroInterno} · Série {frotaAberta.numeroSerie}
            </p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setFotoSelecionada(e.target.files?.[0] || null)}
              style={{ marginBottom: 10 }}
            />
            <textarea
              placeholder="Observação (opcional)"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              style={{ width: '100%', minHeight: 60, marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1 }} onClick={() => setFrotaAberta(null)}>
                Cancelar
              </button>
              <button
                style={{ flex: 1, background: 'var(--fill-accent)', color: 'var(--on-accent)', border: 'none' }}
                disabled={!fotoSelecionada || enviando}
                onClick={confirmarApontamento}
              >
                {enviando ? 'Enviando…' : 'Confirmar adesivação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
