import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useFrotas } from '../hooks/useFrotas';
import { STATUS } from '../utils/statusFlow';

// Acesso via link fixo: /validacao-gestor/:token
// Só relevante para unidades com responsavelApontamento = 'tecnico'.
export default function ValidacaoGestor() {
  const { token } = useParams();
  const [unidade, setUnidade] = useState(null);
  const [erro, setErro] = useState(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState({});
  const { frotas, validarGestor, rejeitar } = useFrotas();

  useEffect(() => {
    async function resolverToken() {
      const q = query(collection(db, 'unidades'), where('tokenValidacaoGestor', '==', token));
      const snap = await getDocs(q);
      if (snap.empty) {
        setErro('Link inválido ou expirado.');
        return;
      }
      setUnidade({ id: snap.docs[0].id, ...snap.docs[0].data() });
    }
    resolverToken();
  }, [token]);

  const fila = useMemo(() => {
    if (!unidade) return [];
    return frotas.filter((f) => f.unidadeId === unidade.id && f.status === STATUS.PENDENTE_VALIDACAO_GESTOR);
  }, [frotas, unidade]);

  if (erro) return <p style={{ padding: '1rem', fontSize: 14, color: 'var(--text-danger)' }}>{erro}</p>;
  if (!unidade) return <p style={{ padding: '1rem', fontSize: 14, color: 'var(--text-secondary)' }}>Carregando…</p>;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '1rem' }}>
      <p style={{ fontSize: 16, fontWeight: 500, margin: '0 0 4px' }}>Confirmar fotos do técnico</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px' }}>{unidade.unidade}</p>

      {fila.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhuma foto pendente de confirmação.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fila.map((f) => (
          <div key={f.id} style={{ border: '0.5px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
            <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
              {f.idNext} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>· interno {f.numeroInterno}</span>
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 10px' }}>Apontado por {f.apontadoPor}</p>
            {f.fotoEvidenciaURL && (
              <img src={f.fotoEvidenciaURL} alt={`Evidência ${f.idNext}`} style={{ width: '100%', borderRadius: 'var(--radius)', marginBottom: 10 }} />
            )}
            <input
              type="text"
              placeholder="Motivo da rejeição (se aplicável)"
              value={motivoRejeicao[f.id] || ''}
              onChange={(e) => setMotivoRejeicao((prev) => ({ ...prev, [f.id]: e.target.value }))}
              style={{ width: '100%', marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{ flex: 1, color: 'var(--text-danger)', borderColor: 'var(--border-danger)' }}
                onClick={() =>
                  rejeitar(f.id, {
                    statusAtual: f.status,
                    motivo: motivoRejeicao[f.id] || 'Não informado',
                    rejeitadoPor: unidade.unidade,
                  })
                }
              >
                Rejeitar
              </button>
              <button
                style={{ flex: 1, background: 'var(--fill-success)', color: 'var(--on-success)', border: 'none' }}
                onClick={() => validarGestor(f.id, { validadoPor: unidade.unidade, unidade })}
              >
                Confirmar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
