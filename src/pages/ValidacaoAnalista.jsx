import { useMemo, useState } from 'react';
import { useFrotasContext } from '../contexts/FrotasContext';
import { useUnidades } from '../hooks/useUnidades';
import { Lightbox } from '../components/Lightbox';
import { STATUS } from '../utils/statusFlow';

export default function ValidacaoAnalista({ usuarioAtual }) {
  const { frotas, validarAnalista, rejeitar } = useFrotasContext();
  const { unidades } = useUnidades();
  const [busca, setBusca] = useState('');
  // Apenas um item em modo rejeição por vez
  const [rejeitandoId, setRejeitandoId] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [fotoAmpliada, setFotoAmpliada] = useState(null);

  const unidadeById = useMemo(() => Object.fromEntries(unidades.map((u) => [u.id, u])), [unidades]);

  const fila = useMemo(() => {
    return frotas
      .filter((f) => f.status === STATUS.PENDENTE_VALIDACAO_ANALISTA)
      .filter((f) => !busca || `${f.idNext}${f.numeroInterno}${f.numeroSerie}`.toLowerCase().includes(busca.toLowerCase()));
  }, [frotas, busca]);

  function abrirRejeicao(frotaId) {
    setRejeitandoId(frotaId);
    setMotivo('');
  }

  async function confirmarRejeicao(f) {
    await rejeitar(f.id, {
      statusAtual: f.status,
      motivo: motivo.trim() || 'Não informado',
      rejeitadoPor: usuarioAtual,
    });
    setRejeitandoId(null);
    setMotivo('');
  }

  return (
    <div className="page-container" style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            Fila de validação final <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 15 }}>({fila.length})</span>
          </h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0' }}>Confira a foto de cada máquina antes de concluir a adesivação.</p>
        </div>
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
          const emRejeicao = rejeitandoId === f.id;
          return (
            <div
              key={f.id}
              className="card card-row"
              style={{ padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}
            >
              {/* Foto grande o suficiente para o analista analisar, com zoom ao clicar */}
              {f.fotoEvidenciaURL ? (
                <img
                  src={f.fotoEvidenciaURL}
                  alt={`Evidência ${f.idNext}`}
                  onClick={() => setFotoAmpliada(f.fotoEvidenciaURL)}
                  style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 10, flexShrink: 0, cursor: 'zoom-in' }}
                />
              ) : (
                <div style={{
                  width: 160, height: 160, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg, #E3EEFB, #D9F5EA)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: 'var(--text-secondary)', gap: 4, textAlign: 'center', padding: 8,
                }}>
                  <span>Foto de evidência</span>
                  <span style={{ fontWeight: 600 }}>{f.idNext}</span>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
                  {f.idNext} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>· interno {f.numeroInterno} · série {f.numeroSerie}</span>
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>{f.clienteCT} · {f.plantaObra}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 8px' }}>
                  Apontado por {f.apontadoPor} {unidade ? `(${unidade.unidade})` : ''}
                </p>
                {f.observacaoApontamento && (
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 10px', fontStyle: 'italic' }}>
                    "{f.observacaoApontamento}"
                  </p>
                )}

                {!emRejeicao ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{ borderColor: 'var(--border-danger)', color: 'var(--text-danger)' }}
                      onClick={() => abrirRejeicao(f.id)}
                    >
                      Rejeitar
                    </button>
                    <button
                      style={{ background: 'var(--mills-verde-escuro)', color: 'var(--mills-verde-claro)', border: 'none', fontWeight: 600 }}
                      onClick={() => validarAnalista(f.id, { validadoPor: usuarioAtual })}
                    >
                      Validar
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Motivo da rejeição"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setRejeitandoId(null)}>Cancelar</button>
                      <button
                        style={{ background: 'var(--text-danger)', color: '#fff', border: 'none', fontWeight: 600 }}
                        onClick={() => confirmarRejeicao(f)}
                      >
                        Confirmar rejeição
                      </button>
                    </div>
                  </div>
                )}
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
