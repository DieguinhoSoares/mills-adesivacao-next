import { useMemo, useState } from 'react';
import { useFrotas } from '../hooks/useFrotas';
import { useUnidades } from '../hooks/useUnidades';
import { STATUS, STATUS_LABEL } from '../utils/statusFlow';

const NOVA_UNIDADE_VAZIA = {
  unidade: '', gerente: '', coordenador: '', supervisor: '',
  encarregado: '', tecnico: '', responsavelApontamento: 'encarregado',
};

// Filtros disponíveis na barra superior
const MODOS = [
  { key: 'pendentes',  label: 'Pendentes' },
  { key: 'todas',      label: 'Todas (reatribuir)' },
  { key: 'lote',       label: 'Reatribuição em lote' },
];

export default function Atribuicao({ usuarioAtual }) {
  const { frotas, atribuirUnidade } = useFrotas();
  const { unidades, criarUnidade } = useUnidades();

  const [modo, setModo] = useState('pendentes');
  const [busca, setBusca] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroGestor, setFiltroGestor] = useState('');

  // Seleção em lote
  const [selecionadas, setSelecionadas] = useState(new Set());

  // Modal individual
  const [frotaSelecionada, setFrotaSelecionada] = useState(null);

  // Modal de unidade (compartilhado por individual e lote)
  const [buscaUnidade, setBuscaUnidade] = useState('');
  const [unidadeEscolhida, setUnidadeEscolhida] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [criandoNova, setCriandoNova] = useState(false);
  const [novaUnidade, setNovaUnidade] = useState(NOVA_UNIDADE_VAZIA);
  const [modalLoteAberto, setModalLoteAberto] = useState(false);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // Clientes e gestores únicos para os filtros de lote
  const clientesUnicos = useMemo(() => [...new Set(frotas.map(f => f.clienteCT).filter(Boolean))].sort(), [frotas]);
  const unidadeById = useMemo(() => Object.fromEntries(unidades.map(u => [u.id, u])), [unidades]);
  const gestoresUnicos = useMemo(() => [...new Set(unidades.map(u => u.encarregado || u.supervisor || u.coordenador).filter(v => v && v !== '-'))].sort(), [unidades]);

  const lista = useMemo(() => {
    return frotas
      .filter(f => {
        if (modo === 'pendentes') return f.status === STATUS.AGUARDANDO_ATRIBUICAO;
        return f.status !== STATUS.ADESIVADO;
      })
      .filter(f => !busca || `${f.idNext}${f.clienteCT}${f.plantaObra}${f.numeroInterno}${f.numeroSerie}`.toLowerCase().includes(busca.toLowerCase()))
      .filter(f => !filtroCliente || f.clienteCT === filtroCliente)
      .filter(f => {
        if (!filtroGestor) return true;
        const u = unidadeById[f.unidadeId];
        return u && (u.encarregado === filtroGestor || u.supervisor === filtroGestor || u.coordenador === filtroGestor);
      });
  }, [frotas, modo, busca, filtroCliente, filtroGestor, unidadeById]);

  const unidadesFiltradas = useMemo(() => {
    if (!buscaUnidade) return unidades.slice(0, 8);
    return unidades.filter(u => u.unidade.toLowerCase().includes(buscaUnidade.toLowerCase())).slice(0, 8);
  }, [unidades, buscaUnidade]);

  function resetModal() {
    setUnidadeEscolhida(null);
    setBuscaUnidade('');
    setMotivo('');
    setCriandoNova(false);
    setNovaUnidade(NOVA_UNIDADE_VAZIA);
    setErro(null);
  }

  function abrirIndividual(frota) {
    setFrotaSelecionada(frota);
    resetModal();
  }

  function toggleSelecionada(id) {
    setSelecionadas(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleTodas() {
    if (selecionadas.size === lista.length) {
      setSelecionadas(new Set());
    } else {
      setSelecionadas(new Set(lista.map(f => f.id)));
    }
  }

  async function resolverUnidade() {
    if (criandoNova) {
      if (!novaUnidade.unidade.trim()) throw new Error('Informe o nome da unidade.');
      const criada = await criarUnidade(novaUnidade);
      return criada.id;
    }
    if (!unidadeEscolhida) throw new Error('Selecione ou crie uma unidade.');
    return unidadeEscolhida.id;
  }

  async function confirmarIndividual() {
    setErro(null);
    setSalvando(true);
    try {
      const unidadeId = await resolverUnidade();
      await atribuirUnidade(frotaSelecionada.id, {
        unidadeId, atribuidoPor: usuarioAtual, motivo,
        statusAtual: frotaSelecionada.status,
      });
      setFrotaSelecionada(null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarLote() {
    if (!motivo.trim()) { setErro('Informe o motivo da reatribuição em lote.'); return; }
    setErro(null);
    setSalvando(true);
    try {
      const unidadeId = await resolverUnidade();
      const frotasLote = frotas.filter(f => selecionadas.has(f.id));
      for (const f of frotasLote) {
        await atribuirUnidade(f.id, {
          unidadeId, atribuidoPor: usuarioAtual, motivo,
          statusAtual: f.status,
        });
      }
      setSelecionadas(new Set());
      setModalLoteAberto(false);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  const isReatribuicao = frotaSelecionada && frotaSelecionada.status !== STATUS.AGUARDANDO_ATRIBUICAO;

  // Painel de seleção de unidade (reutilizado nos dois modais)
  function PainelUnidade() {
    return !criandoNova ? (
      <>
        <input type="text" placeholder="Buscar unidade" value={buscaUnidade}
          onChange={e => setBuscaUnidade(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto', marginBottom: 10 }}>
          {unidadesFiltradas.map(u => (
            <div key={u.id} onClick={() => setUnidadeEscolhida(u)} style={{
              padding: '8px 10px', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13,
              background: unidadeEscolhida?.id === u.id ? 'var(--bg-accent)' : 'transparent',
              color: unidadeEscolhida?.id === u.id ? 'var(--text-accent)' : 'var(--text-primary)',
            }}>
              {u.unidade}
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                {[u.gerente, u.coordenador, u.encarregado].filter(v => v && v !== '-').join(' › ')}
              </span>
            </div>
          ))}
        </div>
        <button style={{ marginBottom: 12 }} onClick={() => setCriandoNova(true)}>Unidade não existe, criar nova</button>
      </>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {['unidade','gerente','coordenador','supervisor','encarregado','tecnico'].map(campo => (
          <input key={campo} type="text" placeholder={campo.charAt(0).toUpperCase()+campo.slice(1)}
            value={novaUnidade[campo]} onChange={e => setNovaUnidade({ ...novaUnidade, [campo]: e.target.value })} />
        ))}
        <select value={novaUnidade.responsavelApontamento}
          onChange={e => setNovaUnidade({ ...novaUnidade, responsavelApontamento: e.target.value })}>
          <option value="encarregado">Responsável pela foto: Encarregado</option>
          <option value="supervisor">Responsável pela foto: Supervisor</option>
          <option value="coordenador">Responsável pela foto: Coordenador</option>
          <option value="tecnico">Responsável pela foto: Técnico</option>
        </select>
        <button onClick={() => setCriandoNova(false)}>Cancelar, buscar existente</button>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 760, margin: '0 auto', padding: '1rem' }}>

      {/* Barra superior */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {MODOS.map(m => (
            <button key={m.key} onClick={() => { setModo(m.key); setSelecionadas(new Set()); }}
              style={{ background: modo === m.key ? 'var(--fill-accent)' : 'transparent', color: modo === m.key ? 'var(--on-accent)' : 'var(--text-primary)', border: '0.5px solid var(--border-strong)' }}>
              {m.label}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Buscar ID Next, interno, série, cliente ou planta"
          value={busca} onChange={e => setBusca(e.target.value)} style={{ width: 280, maxWidth: '100%' }} />
      </div>

      {/* Filtros de lote */}
      {modo === 'lote' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} style={{ flex: 1, minWidth: 180 }}>
            <option value="">Todos os clientes</option>
            {clientesUnicos.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filtroGestor} onChange={e => setFiltroGestor(e.target.value)} style={{ flex: 1, minWidth: 180 }}>
            <option value="">Todos os gestores</option>
            {gestoresUnicos.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      )}

      {/* Cabeçalho de lote */}
      {modo === 'lote' && lista.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={selecionadas.size === lista.length && lista.length > 0}
              onChange={toggleTodas} />
            Selecionar todas ({lista.length})
          </label>
          {selecionadas.size > 0 && (
            <button onClick={() => { setModalLoteAberto(true); resetModal(); }}
              style={{ background: 'var(--fill-accent)', color: 'var(--on-accent)', border: 'none' }}>
              Reatribuir {selecionadas.size} selecionadas
            </button>
          )}
        </div>
      )}

      {/* Lista de frotas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {lista.map(f => {
          const u = unidadeById[f.unidadeId];
          return (
            <div key={f.id} className="card-row" style={{ border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              {modo === 'lote' && (
                <input type="checkbox" checked={selecionadas.has(f.id)} onChange={() => toggleSelecionada(f.id)} style={{ flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
                  {f.idNext} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>· {STATUS_LABEL[f.status]}</span>
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Interno {f.numeroInterno || '—'} · Série {f.numeroSerie || '—'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  {f.clienteCT || '—'} · {f.plantaObra || '—'}
                </p>
                {u && (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    {[u.gerente, u.coordenador, u.supervisor, u.encarregado].filter(v => v && v !== '-').join(' › ')}
                  </p>
                )}
              </div>
              {modo !== 'lote' && (
                <button onClick={() => abrirIndividual(f)}>
                  {f.status === STATUS.AGUARDANDO_ATRIBUICAO ? 'Atribuir' : 'Reatribuir'}
                </button>
              )}
            </div>
          );
        })}
        {lista.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhuma frota nessa lista.</p>}
      </div>

      {/* Modal individual */}
      {frotaSelecionada && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="modal-box" style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '1.25rem', width: '90%', maxWidth: 480 }}>
            <p style={{ fontSize: 15, fontWeight: 500, margin: '0 0 2px' }}>{frotaSelecionada.idNext}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px' }}>
              {frotaSelecionada.clienteCT} · {frotaSelecionada.plantaObra}
            </p>
            <PainelUnidade />
            {isReatribuicao && (
              <input type="text" placeholder="Motivo da reatribuição (obrigatório)"
                value={motivo} onChange={e => setMotivo(e.target.value)}
                style={{ width: '100%', marginBottom: 10 }} />
            )}
            {erro && <p style={{ fontSize: 12, color: 'var(--text-danger)', margin: '0 0 10px' }}>{erro}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1 }} onClick={() => setFrotaSelecionada(null)}>Cancelar</button>
              <button style={{ flex: 1, background: 'var(--fill-accent)', color: 'var(--on-accent)', border: 'none' }}
                disabled={salvando} onClick={confirmarIndividual}>
                {salvando ? 'Salvando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal lote */}
      {modalLoteAberto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="modal-box" style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '1.25rem', width: '90%', maxWidth: 480 }}>
            <p style={{ fontSize: 15, fontWeight: 500, margin: '0 0 2px' }}>Reatribuição em lote</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px' }}>
              {selecionadas.size} frotas selecionadas serão reatribuídas para a unidade escolhida abaixo.
            </p>
            <PainelUnidade />
            <input type="text" placeholder="Motivo da reatribuição (obrigatório)"
              value={motivo} onChange={e => setMotivo(e.target.value)}
              style={{ width: '100%', marginBottom: 10 }} />
            {erro && <p style={{ fontSize: 12, color: 'var(--text-danger)', margin: '0 0 10px' }}>{erro}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1 }} onClick={() => setModalLoteAberto(false)}>Cancelar</button>
              <button style={{ flex: 1, background: 'var(--fill-accent)', color: 'var(--on-accent)', border: 'none' }}
                disabled={salvando} onClick={confirmarLote}>
                {salvando ? `Salvando ${selecionadas.size} frotas…` : `Confirmar ${selecionadas.size} frotas`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
