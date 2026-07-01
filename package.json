import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useFrotas } from '../hooks/useFrotas';
import { Lightbox } from '../components/Lightbox';
import { STATUS } from '../utils/statusFlow';

// Acesso via link fixo: /validacao-gestor/:token
// Só relevante para unidades com responsavelApontamento = 'tecnico'.
export default function ValidacaoGestor() {
  const { token } = useParams();
  const [unidade, setUnidade] = useState(null);
  const [erro, setErro] = useState(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState({});
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
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

  // Frotas reprovadas pela analista que o gestor precisa saber
  const reprovadas = useMemo(() => {
    if (!unidade) return [];
    return frotas.filter((f) =>
      f.unidadeId === unidade.id &&
      f.status === STATUS.PENDENTE &&
      f.rejeitadoNivel === 'analista' &&
      f.motivoRejeicao
    );
  }, [frotas, unidade]);

  if (erro) return <p style={{ padding: '1rem', fontSize: 14, color: 'var(--text-danger)' }}>{erro}</p>;
  if (!unidade) return <p style={{ padding: '1rem', fontSize: 14, color: 'var(--text-secondary)' }}>Carregando…</p>;

  return (
    <div className="page-container" style={{ maxWidth: 560, margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 16, fontWeight: 500, margin: '0 0 4px' }}>Confirmar fotos do técnico</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{unidade.unidade}</p>
        </div>
        {reprovadas.length > 0 && (
          <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 'var(--radius)', background: '#fde8e8', color: 'var(--text-danger)', fontWeight: 500 }}>
            ⚠ {reprovadas.length} reprovada{reprovadas.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {fila.length === 0 && reprovadas.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhuma foto pendente de confirmação.</p>
      )}

      {/* Alertas de rejeição pela analista */}
      {reprovadas.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-danger)', margin: '0 0 8px' }}>
            ⚠ {reprovadas.length} frota{reprovadas.length > 1 ? 's' : ''} reprovada{reprovadas.length > 1 ? 's' : ''} pela analista
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reprovadas.map(f => (
              <div key={f.id} style={{ border: '0.5px solid var(--border-danger)', borderRadius: 'var(--radius)', padding: '10px 12px', background: '#fff5f5' }}>
                <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{f.idNext}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 4px' }}>
                  Interno {f.numeroInterno} · Série {f.numeroSerie}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-danger)', margin: 0, fontStyle: 'italic' }}>
                  Motivo: {f.motivoRejeicao}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Reprovado por {f.rejeitadoPor} em {f.dataRejeicao ? new Date(f.dataRejeicao).toLocaleDateString('pt-BR') : '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fila.map((f) => (
          <div key={f.id} style={{ border: '0.5px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
            <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
              {f.idNext} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>· interno {f.numeroInterno} · série {f.numeroSerie}</span>
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 10px' }}>Apontado por {f.apontadoPor}</p>

            {/* Espaço reservado, grande, para o gestor realmente conseguir
                examinar a evidência antes de confirmar — com zoom ao clicar. */}
            {f.fotoEvidenciaURL ? (
              <img
                src={f.fotoEvidenciaURL}
                alt={`Evidência ${f.idNext}`}
                onClick={() => setFotoAmpliada(f.fotoEvidenciaURL)}
                style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 'var(--radius)', marginBottom: 10, cursor: 'zoom-in' }}
              />
            ) : (
              <div style={{ width: '100%', height: 160, borderRadius: 'var(--radius)', background: 'var(--surface-1)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                Sem foto
              </div>
            )}

            {f.observacaoApontamento && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 10px', fontStyle: 'italic' }}>
                "{f.observacaoApontamento}"
              </p>
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

      <Lightbox src={fotoAmpliada} alt="Evidência ampliada" onClose={() => setFotoAmpliada(null)} />
    </div>
  );
}
