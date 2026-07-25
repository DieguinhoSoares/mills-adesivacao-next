import { useEffect, useMemo, useState } from 'react';
import { useUnidadesContext } from '../contexts/UnidadesContext';
import { useFrotasContext } from '../contexts/FrotasContext';

// Deriva do config do Vite (vite.config.js `base`) em vez de fixar um domínio,
// então continua correto se o app for hospedado em outro domínio/subpasta.
const BASE_URL = `${window.location.origin}${import.meta.env.BASE_URL}`.replace(/\/$/, '');

function linkApontamento(token) {
  return `${BASE_URL}/apontamento/${token}`;
}

function CopiarBotao({ texto }) {
  const [copiado, setCopiado] = useState(false);
  function copiar() {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    });
  }
  return (
    <button
      onClick={copiar}
      style={{
        fontSize: 11,
        padding: '3px 10px',
        borderRadius: 'var(--radius)',
        background: copiado ? 'var(--bg-success)' : 'var(--surface-1)',
        color: copiado ? 'var(--text-success)' : 'var(--text-secondary)',
        border: '0.5px solid var(--border)',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {copiado ? 'Copiado!' : 'Copiar link'}
    </button>
  );
}

function GerarNovoLinkBotao({ onClick }) {
  const [confirmando, setConfirmando] = useState(false);
  if (confirmando) {
    return (
      <span style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 11 }}>
        <span style={{ color: 'var(--text-danger)' }}>Invalida o link atual.</span>
        <button
          onClick={() => { onClick(); setConfirmando(false); }}
          style={{ fontSize: 11, padding: '3px 8px', color: 'var(--text-danger)', borderColor: 'var(--border-danger)' }}
        >
          Confirmar
        </button>
        <button onClick={() => setConfirmando(false)} style={{ fontSize: 11, padding: '3px 8px' }}>Cancelar</button>
      </span>
    );
  }
  return (
    <button
      onClick={() => setConfirmando(true)}
      style={{ fontSize: 11, padding: '3px 10px', background: 'transparent', color: 'var(--text-secondary)', border: '0.5px solid var(--border)' }}
    >
      Gerar novo link
    </button>
  );
}

export default function Links() {
  const { unidades, loading: loadingUnidades, atualizarUnidade } = useUnidadesContext();
  const { frotas, loading: loadingFrotas } = useFrotasContext();
  const [busca, setBusca] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [pagina, setPagina] = useState(0);
  const POR_PAGINA = 30;

  // Conjunto de unidadeIds que têm pelo menos 1 frota NEXT vinculada
  const unidadesComFrotas = useMemo(() => {
    const ids = new Set();
    frotas.forEach(f => { if (f.unidadeId) ids.add(f.unidadeId); });
    return ids;
  }, [frotas]);

  const listaCompleta = useMemo(() => {
    return unidades
      .filter(u => unidadesComFrotas.has(u.id)) // só unidades com frotas NEXT
      .filter(u => !filtroGrupo || u.grupo === filtroGrupo)
      .filter(u => !busca || u.unidade.toLowerCase().includes(busca.toLowerCase()) ||
        [u.gerente, u.coordenador, u.supervisor, u.encarregado]
          .some(v => v && v.toLowerCase().includes(busca.toLowerCase())))
      .sort((a, b) => a.unidade.localeCompare(b.unidade));
  }, [unidades, unidadesComFrotas, busca, filtroGrupo]);

  useEffect(() => { setPagina(0); }, [busca, filtroGrupo]);

  const totalPaginas = Math.max(1, Math.ceil(listaCompleta.length / POR_PAGINA));
  const lista = listaCompleta.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);

  if (loadingUnidades || loadingFrotas) return <p style={{ padding: '1rem', fontSize: 14, color: 'var(--text-secondary)' }}>Carregando…</p>;

  return (
    <div className="page-container" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          Links de apontamento <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 15 }}>({listaCompleta.length} unidades com frotas NEXT)</span>
        </h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={filtroGrupo} onChange={e => setFiltroGrupo(e.target.value)}>
            <option value="">Campo + Oficinas</option>
            <option value="Campo">Campo</option>
            <option value="Oficinas">Oficinas</option>
          </select>
          <input
            type="text"
            placeholder="Buscar unidade ou gestor"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ width: 240, maxWidth: '100%' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {lista.map(u => {
          const hierarquia = [u.gerente, u.coordenador, u.supervisor, u.encarregado]
            .filter(v => v && v !== '-').join(' › ');
          const linkAp = linkApontamento(u.tokenApontamento);

          return (
            <div key={u.id} className="card" style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{u.unidade}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{hierarquia}</p>
                </div>
                <span className="status-pill" style={{
                  background: u.grupo === 'Campo' ? 'var(--bg-accent)' : 'var(--bg-success)',
                  color: u.grupo === 'Campo' ? 'var(--text-accent)' : 'var(--text-success)',
                }}>
                  {u.grupo || '—'}
                </span>
              </div>

              {/* Link de apontamento (o técnico tira a foto e envia direto para a analista) */}
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>
                  Link de apontamento (técnico)
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{
                    fontSize: 12, color: 'var(--text-secondary)', margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                    fontFamily: 'monospace', background: 'var(--surface-1)',
                    padding: '6px 8px', borderRadius: 'var(--radius)',
                  }}>
                    {linkAp}
                  </p>
                  <CopiarBotao texto={linkAp} />
                  <GerarNovoLinkBotao onClick={() => atualizarUnidade(u.id, { tokenApontamento: crypto.randomUUID() })} />
                </div>
              </div>
            </div>
          );
        })}
        {lista.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhuma unidade encontrada.</p>}
      </div>

      {totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 12, fontSize: 13 }}>
          <button disabled={pagina === 0} onClick={() => setPagina(p => p - 1)}>Anterior</button>
          <span style={{ color: 'var(--text-muted)' }}>Página {pagina + 1} de {totalPaginas}</span>
          <button disabled={pagina >= totalPaginas - 1} onClick={() => setPagina(p => p + 1)}>Próxima</button>
        </div>
      )}
    </div>
  );
}
