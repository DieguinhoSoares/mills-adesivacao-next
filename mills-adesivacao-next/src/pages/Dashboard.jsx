import { useMemo, useState } from 'react';
import { useFrotas } from '../hooks/useFrotas';
import { useUnidades } from '../hooks/useUnidades';
import { MetricCard } from '../components/MetricCard';
import { ProgressBar } from '../components/ProgressBar';
import { STATUS, STATUS_LABEL } from '../utils/statusFlow';

const CLIENTE_LEVEL = 'clientePlanta';
// Sequência completa de níveis de drill-down: hierarquia de gestores, depois
// cliente/planta-obra. Depois do último nível, mostramos as máquinas em si.
const FULL_LEVELS = ['gerente', 'coordenador', 'supervisor', 'encarregado', CLIENTE_LEVEL];
const LEVEL_LABELS = {
  gerente: 'Gerente',
  coordenador: 'Coordenador',
  supervisor: 'Supervisor',
  encarregado: 'Encarregado',
  [CLIENTE_LEVEL]: 'Cliente / Planta-Obra',
};

function isApontado(status) {
  return status !== STATUS.AGUARDANDO_ATRIBUICAO && status !== STATUS.PENDENTE;
}
function isValidado(status) {
  return status === STATUS.ADESIVADO;
}

export default function Dashboard() {
  const { frotas, loading: loadingFrotas } = useFrotas();
  const { unidades, loading: loadingUnidades } = useUnidades();
  const [path, setPath] = useState([]);

  const unidadeById = useMemo(() => Object.fromEntries(unidades.map((u) => [u.id, u])), [unidades]);

  const enriquecidas = useMemo(() => {
    return frotas
      .filter((f) => f.unidadeId)
      .map((f) => {
        const u = unidadeById[f.unidadeId] || {};
        const clientePlanta = [f.clienteCT, f.plantaObra].filter(Boolean).join(' · ') || 'Cliente não informado';
        return {
          ...f,
          gerente: u.gerente,
          coordenador: u.coordenador,
          supervisor: u.supervisor,
          encarregado: u.encarregado,
          clientePlanta,
        };
      });
  }, [frotas, unidadeById]);

  const semVinculo = frotas.filter((f) => f.status === STATUS.AGUARDANDO_ATRIBUICAO).length;

  function matchPath(f) {
    return FULL_LEVELS.slice(0, path.length).every((lv, i) => f[lv] === path[i]);
  }

  function aggregate(level) {
    const map = new Map();
    enriquecidas.forEach((f) => {
      if (!matchPath(f)) return;
      const key = f[level];
      if (!key || key === '-') return;
      if (!map.has(key)) map.set(key, { name: key, total: 0, apontado: 0, validado: 0 });
      const e = map.get(key);
      e.total += 1;
      if (isApontado(f.status)) e.apontado += 1;
      if (isValidado(f.status)) e.validado += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.validado / b.total - a.validado / a.total);
  }

  const levelIdx = path.length;
  const dentroDaHierarquia = levelIdx < FULL_LEVELS.length;
  const level = dentroDaHierarquia ? FULL_LEVELS[levelIdx] : null;
  const rows = dentroDaHierarquia ? aggregate(level) : [];

  // Último nível: lista as máquinas individuais (não agregadas).
  const maquinas = !dentroDaHierarquia ? enriquecidas.filter(matchPath) : [];

  const totalAll = dentroDaHierarquia ? rows.reduce((s, r) => s + r.total, 0) : maquinas.length;
  const apontAll = dentroDaHierarquia ? rows.reduce((s, r) => s + r.apontado, 0) : maquinas.filter((f) => isApontado(f.status)).length;
  const validAll = dentroDaHierarquia ? rows.reduce((s, r) => s + r.validado, 0) : maquinas.filter((f) => isValidado(f.status)).length;

  if (loadingFrotas || loadingUnidades) {
    return <p style={{ padding: '1rem', fontSize: 14, color: 'var(--text-secondary)' }}>Carregando…</p>;
  }

  return (
    <div className="page-container" style={{ maxWidth: 760, margin: '0 auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="metric-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
        <MetricCard label="Frotas NEXT" value={totalAll} />
        <MetricCard label="Apontado" value={totalAll ? `${Math.round((apontAll / totalAll) * 100)}%` : '0%'} color="var(--text-accent)" />
        <MetricCard label="Validado" value={totalAll ? `${Math.round((validAll / totalAll) * 100)}%` : '0%'} color="var(--text-success)" />
        <MetricCard label="Aguardando atribuição" value={semVinculo} color="var(--text-muted)" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          <span style={{ cursor: 'pointer', color: 'var(--text-accent)' }} onClick={() => setPath([])}>
            Todos
          </span>
          {path.map((p, i) => (
            <span key={p}>
              {' › '}
              <span style={{ cursor: 'pointer', color: 'var(--text-accent)' }} onClick={() => setPath(path.slice(0, i + 1))}>
                {p}
              </span>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#85B7EB' }} /> Apontado
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#1D9E75' }} /> Validado
          </span>
        </div>
      </div>

      {dentroDaHierarquia ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((r) => {
            const pctApontado = r.total ? Math.round((r.apontado / r.total) * 100) : 0;
            const pctValidado = r.total ? Math.round((r.validado / r.total) * 100) : 0;
            return (
              <div
                key={r.name}
                onClick={() => setPath([...path, r.name])}
                style={{ border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {r.name} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>· {LEVEL_LABELS[level]}</span>
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {r.total} máquinas · {pctValidado}% validado
                  </span>
                </div>
                <ProgressBar pctApontado={pctApontado} pctValidado={pctValidado} />
              </div>
            );
          })}
          {rows.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhuma frota nesse recorte.</p>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Máquinas de {path[path.length - 1]}:
          </p>
          {maquinas.map((f) => (
            <div key={f.id} className="card-row" style={{ border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{f.idNext}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Interno {f.numeroInterno || '—'} · Série {f.numeroSerie || '—'}
                </p>
              </div>
              <span
                style={{
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius)',
                  background: isValidado(f.status) ? 'var(--bg-success)' : isApontado(f.status) ? 'var(--bg-accent)' : 'var(--surface-1)',
                  color: isValidado(f.status) ? 'var(--text-success)' : isApontado(f.status) ? 'var(--text-accent)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                }}
              >
                {STATUS_LABEL[f.status]}
              </span>
            </div>
          ))}
          {maquinas.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhuma máquina nesse recorte.</p>}
        </div>
      )}
    </div>
  );
}
