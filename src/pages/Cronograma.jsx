import { useMemo, useState } from 'react';
import { useFrotasContext } from '../contexts/FrotasContext';
import { ETAPAS, ETAPA_LABEL, ETAPA_CORES, etapaDaFrota, diasDesde } from '../utils/regularizacao';

function EtapaBadge({ etapa, count }) {
  const cor = ETAPA_CORES[etapa];
  return (
    <span style={{
      fontSize: 11, padding: '3px 8px', borderRadius: 'var(--radius)',
      background: cor.bg, color: cor.fg, whiteSpace: 'nowrap',
    }}>
      {ETAPA_LABEL[etapa]}{count != null ? ` · ${count}` : ''}
    </span>
  );
}

// Barra de progresso de 4 etapas do lote, com a data de entrada em cada uma.
function LinhaDoTempo({ datas, etapaAtual }) {
  const idxAtual = ETAPAS.indexOf(etapaAtual);
  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
      {ETAPAS.map((et, i) => {
        const ativa = i <= idxAtual;
        const cor = ETAPA_CORES[et];
        return (
          <div key={et} style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              height: 6, borderRadius: 3,
              background: ativa ? (et === 'finalizado' ? 'var(--fill-success)' : 'var(--fill-accent)') : 'var(--surface-1)',
            }} />
            <p style={{ fontSize: 10, color: ativa ? cor.fg : 'var(--text-muted)', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ETAPA_LABEL[et]}
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>
              {datas[et] ? new Date(datas[et]).toLocaleDateString('pt-BR') : '—'}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function Cronograma({ usuarioAtual }) {
  const { frotas, loading, atualizarRegularizacao } = useFrotasContext();
  const [busca, setBusca] = useState('');
  const [filtroEtapa, setFiltroEtapa] = useState('');
  const [loteAberto, setLoteAberto] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const lotes = useMemo(() => {
    const map = new Map();
    frotas
      .filter((f) => f.unidadeId) // só frotas já atribuídas entram no cronograma
      .forEach((f) => {
        const key = [f.clienteCT || 'Sem cliente', f.plantaObra || 'Sem planta'].join(' · ');
        if (!map.has(key)) map.set(key, { key, cliente: f.clienteCT, planta: f.plantaObra, frotas: [] });
        map.get(key).frotas.push(f);
      });

    return Array.from(map.values())
      .map((lote) => {
        const porEtapa = Object.fromEntries(ETAPAS.map((e) => [e, 0]));
        const datas = {};
        lote.frotas.forEach((f) => {
          porEtapa[etapaDaFrota(f)] += 1;
          (f.regularizacao?.historico || []).forEach((h) => {
            if (!datas[h.etapa] || h.data < datas[h.etapa]) datas[h.etapa] = h.data;
          });
        });
        // Etapa "do lote" = a mais atrasada com frotas (gargalo do grupo)
        const etapaLote = ETAPAS.find((e) => porEtapa[e] > 0) || 'compras';
        const ultimaAtualizacao = lote.frotas
          .map((f) => f.regularizacao?.atualizadoEm)
          .filter(Boolean)
          .sort()
          .pop() || null;
        return { ...lote, porEtapa, datas, etapaLote, ultimaAtualizacao };
      })
      .filter((l) => !filtroEtapa || l.porEtapa[filtroEtapa] > 0)
      .filter((l) => !busca || l.key.toLowerCase().includes(busca.toLowerCase()))
      .sort((a, b) => ETAPAS.indexOf(a.etapaLote) - ETAPAS.indexOf(b.etapaLote) || a.key.localeCompare(b.key));
  }, [frotas, busca, filtroEtapa]);

  const totais = useMemo(() => {
    const t = Object.fromEntries(ETAPAS.map((e) => [e, 0]));
    frotas.filter((f) => f.unidadeId).forEach((f) => { t[etapaDaFrota(f)] += 1; });
    return t;
  }, [frotas]);

  async function moverLote(lote, etapa) {
    setSalvando(true);
    try {
      await atualizarRegularizacao(lote.frotas.map((f) => f.id), { etapa, atualizadoPor: usuarioAtual });
    } finally {
      setSalvando(false);
    }
  }

  async function moverFrota(frotaId, etapa) {
    setSalvando(true);
    try {
      await atualizarRegularizacao(frotaId, { etapa, atualizadoPor: usuarioAtual });
    } finally {
      setSalvando(false);
    }
  }

  if (loading) return <p style={{ padding: '1rem', fontSize: 14, color: 'var(--text-secondary)' }}>Carregando…</p>;

  return (
    <div className="page-container" style={{ maxWidth: 980, margin: '0 auto' }}>
      <h1 className="page-title">Cronograma de regularização</h1>
      <p className="page-subtitle">Planejamento por cliente/planta das frotas que precisam de adesivos, da produção à aplicação.</p>

      {/* Métricas gerais */}
      <div className="metric-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 14, marginBottom: 20 }}>
        {ETAPAS.map((et) => {
          const cor = ETAPA_CORES[et];
          return (
            <div key={et} className="card" style={{ padding: '16px 18px' }}>
              <p style={{ fontSize: 26, fontWeight: 700, margin: 0, color: cor.fg }}>{totais[et]}</p>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '2px 0 0' }}>{ETAPA_LABEL[et]}</p>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
          Lotes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({lotes.length})</span>
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={filtroEtapa} onChange={(e) => setFiltroEtapa(e.target.value)}>
            <option value="">Todas as etapas</option>
            {ETAPAS.map((et) => <option key={et} value={et}>{ETAPA_LABEL[et]}</option>)}
          </select>
          <input
            type="text"
            placeholder="Buscar cliente ou planta"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ width: 220, maxWidth: '100%' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {lotes.map((lote) => {
          const aberto = loteAberto === lote.key;
          const dias = diasDesde(lote.ultimaAtualizacao);
          return (
            <div key={lote.key} className="card" style={{ padding: '14px 18px' }}>
              <div
                onClick={() => setLoteAberto(aberto ? null : lote.key)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{lote.cliente || 'Sem cliente'}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    {lote.planta || 'Sem planta'} · {lote.frotas.length} máquina{lote.frotas.length > 1 ? 's' : ''}
                    {dias != null && ` · atualizado há ${dias === 0 ? 'hoje' : `${dias}d`}`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ETAPAS.filter((e) => lote.porEtapa[e] > 0).map((e) => (
                    <EtapaBadge key={e} etapa={e} count={lote.porEtapa[e]} />
                  ))}
                </div>
              </div>

              <LinhaDoTempo datas={lote.datas} etapaAtual={lote.etapaLote} />

              {aberto && (
                <div style={{ marginTop: 12, borderTop: '0.5px solid var(--border)', paddingTop: 12 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>Mover lote inteiro para:</span>
                    {ETAPAS.map((et) => (
                      <button
                        key={et}
                        disabled={salvando}
                        onClick={() => moverLote(lote, et)}
                        style={{ fontSize: 12, padding: '4px 10px' }}
                      >
                        {ETAPA_LABEL[et]}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {lote.frotas.map((f) => {
                      const et = etapaDaFrota(f);
                      return (
                        <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <strong>{f.idNext}</strong>
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> · {f.numeroInterno || '—'}</span>
                          </span>
                          <select
                            value={et}
                            disabled={salvando}
                            onChange={(e) => moverFrota(f.id, e.target.value)}
                            style={{ fontSize: 12 }}
                          >
                            {ETAPAS.map((opt) => <option key={opt} value={opt}>{ETAPA_LABEL[opt]}</option>)}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {lotes.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhum lote nesse recorte.</p>}
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
        A aplicação só inicia após a entrega do lote de adesivos da unidade; o status acompanha o progresso real das frotas.
      </p>
    </div>
  );
}
