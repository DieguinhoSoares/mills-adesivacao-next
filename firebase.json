import { useMemo, useState } from 'react';
import { useFrotas } from '../hooks/useFrotas';
import { useUnidades } from '../hooks/useUnidades';
import { STATUS_LABEL } from '../utils/statusFlow';

export default function Frotas() {
  const { frotas, loading } = useFrotas();
  const { unidades } = useUnidades();
  const [busca, setBusca] = useState('');

  const unidadeById = useMemo(() => Object.fromEntries(unidades.map((u) => [u.id, u])), [unidades]);

  const lista = useMemo(() => {
    const termo = busca.toLowerCase();
    return frotas.filter(
      (f) =>
        !termo ||
        `${f.idNext}${f.numeroInterno}${f.numeroSerie}${f.clienteCT}${f.plantaObra}`.toLowerCase().includes(termo)
    );
  }, [frotas, busca]);

  if (loading) return <p style={{ padding: '1rem', fontSize: 14, color: 'var(--text-secondary)' }}>Carregando…</p>;

  return (
    <div className="page-container" style={{ maxWidth: 960, margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
          Frotas NEXT <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({lista.length})</span>
        </p>
        <input
          type="text"
          placeholder="Buscar ID Next, nº interno, série, cliente ou planta"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ width: 320, maxWidth: '100%' }}
        />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-strong)' }}>
              <th style={{ padding: '8px 10px' }}>ID Next</th>
              <th style={{ padding: '8px 10px' }}>Nº interno</th>
              <th style={{ padding: '8px 10px' }}>Nº de série</th>
              <th style={{ padding: '8px 10px' }}>Cliente CT</th>
              <th style={{ padding: '8px 10px' }}>Planta / Obra</th>
              <th style={{ padding: '8px 10px' }}>Gestor (Encarregado)</th>
              <th style={{ padding: '8px 10px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((f) => {
              const u = unidadeById[f.unidadeId];
              return (
                <tr key={f.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 500 }}>{f.idNext}</td>
                  <td style={{ padding: '8px 10px' }}>{f.numeroInterno || '—'}</td>
                  <td style={{ padding: '8px 10px' }}>{f.numeroSerie || '—'}</td>
                  <td style={{ padding: '8px 10px' }}>{f.clienteCT || '—'}</td>
                  <td style={{ padding: '8px 10px' }}>{f.plantaObra || '—'}</td>
                  <td style={{ padding: '8px 10px' }}>{u?.encarregado || u?.supervisor || u?.coordenador || '—'}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius)',
                        background: 'var(--surface-1)',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {STATUS_LABEL[f.status]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
