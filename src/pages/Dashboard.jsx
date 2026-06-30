import { useMemo, useState } from 'react';
import { useFrotas } from '../hooks/useFrotas';
import { useUnidades } from '../hooks/useUnidades';
import { MetricCard } from '../components/MetricCard';
import { ProgressBar } from '../components/ProgressBar';
import { STATUS } from '../utils/statusFlow';

const LEVELS = ['gerente', 'coordenador', 'supervisor', 'encarregado'];
const LEVEL_LABELS = { gerente: 'Gerente', coordenador: 'Coordenador', supervisor: 'Supervisor', encarregado: 'Encarregado' };

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
        return { ...f, gerente: u.gerente, coordenador: u.coordenador, supervisor: u.supervisor, encarregado: u.encarregado };
      });
  }, [frotas, unidadeById]);

  const semVinculo = frotas.filter((f) => f.status === STATUS.AGUARDANDO_ATRIBUICAO).length;

  function aggregate(level) {
    const map = new Map();
    enriquecidas.forEach((f) => {
      const matchPath = LEVELS.slice(0, path.length).every((lv, i) => f[lv] === path[i]);
      if (!matchPath) return;
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
  const level = LEVELS[levelIdx];
  const rows = level ? aggregate(level) : [];
  const totalAll = rows.reduce((s, r) => s + r.total, 0);
  const apontAll = rows.reduce((s, r) => s + r.apontado, 0);
  const validAll = rows.reduce((s, r) => s + r.validado, 0);

  if (loadingFrotas || loadingUnidades) {
    return <p style={{ padding: '1rem', fontSize: 14, color: 'var(--text-secondary)' }}>Carregando…</p>;
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
        <MetricCard label="Frotas NEXT" value={frotas.length} />
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!level && <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Nível mais detalhado alcançado.</p>}
        {rows.map((r) => {
          const pctApontado = r.total ? Math.round((r.apontado / r.total) * 100) : 0;
          const pctValidado = r.total ? Math.round((r.validado / r.total) * 100) : 0;
          return (
            <div
              key={r.name}
              onClick={() => levelIdx < LEVELS.length - 1 && setPath([...path, r.name])}
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
      </div>
    </div>
  );
}
