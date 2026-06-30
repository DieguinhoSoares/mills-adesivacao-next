import { useMemo, useState } from 'react';
import { useFrotas } from '../hooks/useFrotas';
import { useUnidades } from '../hooks/useUnidades';
import { STATUS } from '../utils/statusFlow';

export default function ValidacaoAnalista({ usuarioAtual }) {
  const { frotas, validarAnalista, rejeitar } = useFrotas();
  const { unidades } = useUnidades();
  const [busca, setBusca] = useState('');
  const [motivoRejeicao, setMotivoRejeicao] = useState({});

  const unidadeById = useMemo(() => Object.fromEntries(unidades.map((u) => [u.id, u])), [unidades]);

  const fila = useMemo(() => {
    return frotas
      .filter((f) => f.status === STATUS.PENDENTE_VALIDACAO_ANALISTA)
      .filter((f) => !busca || `${f.idNext}${f.numeroInterno}${f.numeroSerie}`.toLowerCase().includes(busca.toLowerCase()));
  }, [frotas, busca]);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
          Pendentes de validação <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({fila.length})</span>
        </p>
        <input
          type="text"
          placeholder="Buscar nº interno, série ou ID Next"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ width: 260 }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {fila.map((f) => {
          const unidade = unidadeById[f.unidadeId];
          return (
            <div key={f.id} style={{ background: 'var(--surface-2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {f.fotoEvidenciaURL ? (
                <img src={f.fotoEvidenciaURL} alt={`Evidência ${f.idNext}`} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 'var(--radius)', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: 'var(--radius)', background: 'var(--surface-1)', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
                  {f.idNext} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>· interno {f.numeroInterno}</span>
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>{f.plantaObra}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 8px' }}>
                  Apontado por {f.apontadoPor} {unidade ? `(${unidade.unidade})` : ''}
                </p>
                <input
                  type="text"
                  placeholder="Motivo da rejeição (se aplicável)"
                  value={motivoRejeicao[f.id] || ''}
                  onChange={(e) => setMotivoRejeicao((prev) => ({ ...prev, [f.id]: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
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
          );
        })}
        {fila.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhum item pendente.</p>}
      </div>
    </div>
  );
}
