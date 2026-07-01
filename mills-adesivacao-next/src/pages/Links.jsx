import { useMemo, useState } from 'react';
import { useUnidades } from '../hooks/useUnidades';
import { useFrotas } from '../hooks/useFrotas';

const BASE_URL = import.meta.env.PROD
  ? 'https://dieguinhosoares.github.io/mills-adesivacao-next'
  : window.location.origin;

function linkApontamento(token) {
  return `${BASE_URL}/apontamento/${token}`;
}
function linkValidacaoGestor(token) {
  return `${BASE_URL}/validacao-gestor/${token}`;
}

function CopiarBotao({ texto }) {
  const [copiado, setCopiado] = useState(false);
  function copiar() {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
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

export default function Links() {
  const { unidades, loading: loadingUnidades } = useUnidades();
  const { frotas, loading: loadingFrotas } = useFrotas();
  const [busca, setBusca] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');

  // Conjunto de unidadeIds que têm pelo menos 1 frota NEXT vinculada
  const unidadesComFrotas = useMemo(() => {
    const ids = new Set();
    frotas.forEach(f => { if (f.unidadeId) ids.add(f.unidadeId); });
    return ids;
  }, [frotas]);

  const lista = useMemo(() => {
    return unidades
      .filter(u => unidadesComFrotas.has(u.id)) // só unidades com frotas NEXT
      .filter(u => !filtroGrupo || u.grupo === filtroGrupo)
      .filter(u => !busca || u.unidade.toLowerCase().includes(busca.toLowerCase()) ||
        [u.gerente, u.coordenador, u.supervisor, u.encarregado]
          .some(v => v && v.toLowerCase().includes(busca.toLowerCase())))
      .sort((a, b) => a.unidade.localeCompare(b.unidade));
  }, [unidades, unidadesComFrotas, busca, filtroGrupo]);

  if (loadingUnidades || loadingFrotas) return <p style={{ padding: '1rem', fontSize: 14, color: 'var(--text-secondary)' }}>Carregando…</p>;

  return (
    <div className="page-container" style={{ maxWidth: 880, margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
          Links de apontamento <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({lista.length} unidades com frotas NEXT)</span>
        </p>
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
          const linkVal = linkValidacaoGestor(u.tokenValidacaoGestor);
          const temTecnico = u.responsavelApontamento === 'tecnico';

          return (
            <div key={u.id} style={{ border: '0.5px solid var(--border)', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{u.unidade}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{hierarquia}</p>
                </div>
                <span style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 'var(--radius)',
                  background: u.grupo === 'Campo' ? 'var(--bg-accent)' : 'var(--bg-success)',
                  color: u.grupo === 'Campo' ? 'var(--text-accent)' : 'var(--text-success)',
                  whiteSpace: 'nowrap',
                }}>
                  {u.grupo || '—'}
                </span>
              </div>

              {/* Link de apontamento (gestor / técnico tira a foto) */}
              <div style={{ marginBottom: temTecnico ? 8 : 0 }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>
                  Link de apontamento ({u.responsavelApontamento || 'gestor'})
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
                </div>
              </div>

              {/* Link de validação intermediária (só quando técnico aponta) */}
              {temTecnico && (
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>
                    Link de validação do gestor
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{
                      fontSize: 12, color: 'var(--text-secondary)', margin: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                      fontFamily: 'monospace', background: 'var(--surface-1)',
                      padding: '6px 8px', borderRadius: 'var(--radius)',
                    }}>
                      {linkVal}
                    </p>
                    <CopiarBotao texto={linkVal} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {lista.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhuma unidade encontrada.</p>}
      </div>
    </div>
  );
}
