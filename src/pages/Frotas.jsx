import { useEffect, useMemo, useState } from 'react';
import { useFrotasContext } from '../contexts/FrotasContext';
import { useUnidades } from '../hooks/useUnidades';
import { StatusPill } from '../components/StatusPill';
import { STATUS } from '../utils/statusFlow';

const POR_PAGINA = 50;

const thStyle = {
  fontSize: 11.5,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--text-secondary)',
  fontWeight: 600,
  padding: '11px 14px',
  textAlign: 'left',
};

const tdStyle = { padding: '10px 14px', fontSize: 13 };

export default function Frotas() {
  const { frotas, loading } = useFrotasContext();
  const { unidades } = useUnidades();
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(0);

  const unidadeById = useMemo(() => Object.fromEntries(unidades.map((u) => [u.id, u])), [unidades]);

  const listaCompleta = useMemo(() => {
    const termo = busca.toLowerCase();
    return frotas.filter(
      (f) =>
        !termo ||
        `${f.idNext}${f.numeroInterno}${f.numeroSerie}${f.clienteCT}${f.plantaObra}`.toLowerCase().includes(termo)
    );
  }, [frotas, busca]);

  useEffect(() => { setPagina(0); }, [busca]);

  const totalPaginas = Math.max(1, Math.ceil(listaCompleta.length / POR_PAGINA));
  const lista = listaCompleta.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);

  if (loading) return <p style={{ padding: '1rem', fontSize: 14, color: 'var(--text-secondary)' }}>Carregando…</p>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          Frotas NEXT <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 15 }}>({listaCompleta.length})</span>
        </h1>
        <input
          type="text"
          placeholder="Buscar ID Next, nº interno, série, cliente ou planta"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ width: 320, maxWidth: '100%' }}
        />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-1)' }}>
                <th style={thStyle}>ID Next</th>
                <th style={thStyle}>Nº interno</th>
                <th style={thStyle}>Nº de série</th>
                <th style={thStyle}>Cliente CT</th>
                <th style={thStyle}>Planta / Obra</th>
                <th style={thStyle}>Gestor (Encarregado)</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((f) => {
                const u = unidadeById[f.unidadeId];
                return (
                  <tr key={f.id} style={{ borderBottom: '0.5px solid rgba(0,64,66,0.08)' }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{f.idNext}</td>
                    <td style={tdStyle}>{f.numeroInterno || '—'}</td>
                    <td style={tdStyle}>{f.numeroSerie || '—'}</td>
                    <td style={tdStyle}>{f.clienteCT || '—'}</td>
                    <td style={tdStyle}>{f.plantaObra || '—'}</td>
                    <td style={tdStyle}>{u?.encarregado || u?.supervisor || u?.coordenador || '—'}</td>
                    <td style={tdStyle}>
                      <StatusPill status={f.status} reprovado={f.status === STATUS.PENDENTE && !!f.motivoRejeicao} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 12, fontSize: 13 }}>
          <button disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>Anterior</button>
          <span style={{ color: 'var(--text-muted)' }}>Página {pagina + 1} de {totalPaginas}</span>
          <button disabled={pagina >= totalPaginas - 1} onClick={() => setPagina((p) => p + 1)}>Próxima</button>
        </div>
      )}
    </div>
  );
}
