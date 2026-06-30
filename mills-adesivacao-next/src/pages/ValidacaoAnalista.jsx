import { useMemo, useState } from 'react';
import { useFrotas } from '../hooks/useFrotas';
import { useUnidades } from '../hooks/useUnidades';
import { Lightbox } from '../components/Lightbox';
import { STATUS } from '../utils/statusFlow';

export default function ValidacaoAnalista({ usuarioAtual }) {
  const { frotas, validarAnalista, rejeitar } = useFrotas();
  const { unidades } = useUnidades();
  const [busca, setBusca] = useState('');
  const [motivoRejeicao, setMotivoRejeicao] = useState({});
  const [fotoAmpliada, setFotoAmpliada] = useState(null);

  const unidadeById = useMemo(() => Object.fromEntries(unidades.map((u) => [u.id, u])), [unidades]);

  const fila = useMemo(() => {
    return frotas
      .filter((f) => f.status === STATUS.PENDENTE_VALIDACAO_ANALISTA)
      .filter((f) => !busca || `${f.idNext}${f.numeroInterno}${f.numeroSerie}`.toLowerCase().includes(busca.toLowerCase()));
  }, [frotas, busca]);

  return (
    <div className="page-container" style={{ maxWidth: 880, margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
          Pendentes de validação <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({fila.length})</span>
        </p>
        <input
          type="text"
          placeholder="Buscar nº interno, série ou ID Next"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ width: 260, maxWidth: '100%' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fila.map((f) => {
          const unidade = unidadeById[f.unidadeId];
          return (
            <div
              key={f.id}
              className="card-row"
              style={{ background: 'var(--surface-2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', gap: 16, alignItems: 'flex-start' }}
            >
              {/* Espaço reservado para a foto coletada em campo: grande o suficiente
                  para o analista realmente analisar o item adesivado, com zoom ao clicar. */}
              {f.fotoEvidenciaURL ? (
                <img
                  src={f.fotoEvidenciaURL}
                  alt={`Evidência ${f.idNext}`}
                  onClick={() => setFotoAmpliada(f.fotoEvidenciaURL)}
                  style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 'var(--radius)', flexShrink: 0, cursor: 'zoom-in' }}
                />
              ) : (
                <div style={{ width: 160, height: 160, borderRadius: 'var(--radius)', background: 'var(--surface-1)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                  Sem foto
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
                  {f.idNext} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>· interno {f.numeroInterno} · série {f.numeroSerie}</span>
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>{f.clienteCT} · {f.plantaObra}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 8px' }}>
                  Apontado por {f.apontadoPor} {unidade ? `(${unidade.unidade})` : ''}
                </p>
                {f.observacaoApontamento && (
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 8px', fontStyle: 'italic' }}>
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
                    style={{ color: 'var(--text-danger)', borderColor: 'var(--border-danger)' }}
                    onClick={() =>
                      rejeitar(f.id, {
                        statusAtual: f.status,
                        motivo: motivoRejeicao[f.id] || 'Não informado',
                        rejeitadoPor: usuarioAtual,
                      })
                    }
                  >
                    Rejeitar
                  </button>
                  <button
                    style={{ background: 'var(--fill-success)', color: 'var(--on-success)', border: 'none' }}
                    onClick={() => validarAnalista(f.id, { validadoPor: usuarioAtual, unidade })}
                  >
                    Validar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {fila.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhum item pendente.</p>}
      </div>

      <Lightbox src={fotoAmpliada} alt="Evidência ampliada" onClose={() => setFotoAmpliada(null)} />
    </div>
  );
}
