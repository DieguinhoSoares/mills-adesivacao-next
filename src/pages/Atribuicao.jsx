import { useMemo, useState } from 'react';
import { useFrotas } from '../hooks/useFrotas';
import { useUnidades } from '../hooks/useUnidades';
import { STATUS, STATUS_LABEL } from '../utils/statusFlow';

const NOVA_UNIDADE_VAZIA = {
  unidade: '',
  gerente: '',
  coordenador: '',
  supervisor: '',
  encarregado: '',
  tecnico: '',
  responsavelApontamento: 'encarregado',
};

export default function Atribuicao({ usuarioAtual }) {
  const { frotas, atribuirUnidade } = useFrotas();
  const { unidades, criarUnidade } = useUnidades();
  const [busca, setBusca] = useState('');
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [frotaSelecionada, setFrotaSelecionada] = useState(null);
  const [buscaUnidade, setBuscaUnidade] = useState('');
  const [unidadeEscolhida, setUnidadeEscolhida] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [criandoNova, setCriandoNova] = useState(false);
  const [novaUnidade, setNovaUnidade] = useState(NOVA_UNIDADE_VAZIA);
  const [erro, setErro] = useState(null);

  const lista = useMemo(() => {
    return frotas
      .filter((f) => (mostrarTodas ? true : f.status === STATUS.AGUARDANDO_ATRIBUICAO))
      .filter((f) => !busca || `${f.idNext}${f.clienteCT}${f.plantaObra}`.toLowerCase().includes(busca.toLowerCase()));
  }, [frotas, busca, mostrarTodas]);

  const unidadesFiltradas = useMemo(() => {
    if (!buscaUnidade) return unidades.slice(0, 8);
    return unidades.filter((u) => u.unidade.toLowerCase().includes(buscaUnidade.toLowerCase())).slice(0, 8);
  }, [unidades, buscaUnidade]);

  function abrirAtribuicao(frota) {
    setFrotaSelecionada(frota);
    setUnidadeEscolhida(null);
    setBuscaUnidade('');
    setMotivo('');
    setCriandoNova(false);
    setNovaUnidade(NOVA_UNIDADE_VAZIA);
    setErro(null);
  }

  async function confirmar() {
    setErro(null);
    try {
      let unidadeId = unidadeEscolhida?.id;
      if (criandoNova) {
        if (!novaUnidade.unidade.trim()) {
          setErro('Informe o nome da unidade.');
          return;
        }
        const criada = await criarUnidade(novaUnidade);
        unidadeId = criada.id;
      }
      if (!unidadeId) {
        setErro('Selecione ou crie uma unidade.');
        return;
      }
      await atribuirUnidade(frotaSelecionada.id, {
        unidadeId,
        atribuidoPor: usuarioAtual,
        motivo,
        statusAtual: frotaSelecionada.status,
      });
      setFrotaSelecionada(null);
    } catch (e) {
      setErro(e.message);
    }
  }

  const isReatribuicao = frotaSelecionada && frotaSelecionada.status !== STATUS.AGUARDANDO_ATRIBUICAO;

  return (
    <div className="page-container" style={{ maxWidth: 720, margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
          {mostrarTodas ? 'Todas as frotas' : 'Aguardando atribuição'} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({lista.length})</span>
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setMostrarTodas((v) => !v)}>
            {mostrarTodas ? 'Ver só pendentes' : 'Ver todas (reatribuir)'}
          </button>
          <input type="text" placeholder="Buscar Cliente CT, Planta ou ID Next" value={busca} onChange={(e) => setBusca(e.target.value)} style={{ width: 240 }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {lista.map((f) => (
          <div key={f.id} className="card-row" style={{ border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{f.idNext} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}>· {STATUS_LABEL[f.status]}</span></p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Interno {f.numeroInterno || '—'} · Série {f.numeroSerie || '—'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>{f.clienteCT || 'Cliente não informado'} · {f.plantaObra || 'Planta/Obra não informada'}</p>
            </div>
            <button onClick={() => abrirAtribuicao(f)}>{f.status === STATUS.AGUARDANDO_ATRIBUICAO ? 'Atribuir' : 'Reatribuir'}</button>
          </div>
        ))}
        {lista.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhuma frota nessa lista.</p>}
      </div>

      {frotaSelecionada && (
        <div style={{ position: 'relative', minHeight: 380, background: 'rgba(0,0,0,0.45)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
          <div className="modal-box" style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '1.25rem', width: '90%', maxWidth: 480 }}>
            <p style={{ fontSize: 15, fontWeight: 500, margin: '0 0 4px' }}>{frotaSelecionada.idNext}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px' }}>{frotaSelecionada.clienteCT} · {frotaSelecionada.plantaObra}</p>

            {!criandoNova ? (
              <>
                <input
                  type="text"
                  placeholder="Buscar unidade"
                  value={buscaUnidade}
                  onChange={(e) => setBuscaUnidade(e.target.value)}
                  style={{ width: '100%', marginBottom: 8 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto', marginBottom: 10 }}>
                  {unidadesFiltradas.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => setUnidadeEscolhida(u)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        fontSize: 13,
                        background: unidadeEscolhida?.id === u.id ? 'var(--bg-accent)' : 'transparent',
                        color: unidadeEscolhida?.id === u.id ? 'var(--text-accent)' : 'var(--text-primary)',
                      }}
                    >
                      {u.unidade}
                    </div>
                  ))}
                </div>
                <button style={{ marginBottom: 12 }} onClick={() => setCriandoNova(true)}>
                  Unidade não existe, criar nova
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                <input type="text" placeholder="Nome da unidade" value={novaUnidade.unidade} onChange={(e) => setNovaUnidade({ ...novaUnidade, unidade: e.target.value })} />
                <input type="text" placeholder="Gerente" value={novaUnidade.gerente} onChange={(e) => setNovaUnidade({ ...novaUnidade, gerente: e.target.value })} />
                <input type="text" placeholder="Coordenador" value={novaUnidade.coordenador} onChange={(e) => setNovaUnidade({ ...novaUnidade, coordenador: e.target.value })} />
                <input type="text" placeholder="Supervisor" value={novaUnidade.supervisor} onChange={(e) => setNovaUnidade({ ...novaUnidade, supervisor: e.target.value })} />
                <input type="text" placeholder="Encarregado" value={novaUnidade.encarregado} onChange={(e) => setNovaUnidade({ ...novaUnidade, encarregado: e.target.value })} />
                <input type="text" placeholder="Técnico" value={novaUnidade.tecnico} onChange={(e) => setNovaUnidade({ ...novaUnidade, tecnico: e.target.value })} />
                <select value={novaUnidade.responsavelApontamento} onChange={(e) => setNovaUnidade({ ...novaUnidade, responsavelApontamento: e.target.value })}>
                  <option value="encarregado">Responsável pela foto: Encarregado</option>
                  <option value="supervisor">Responsável pela foto: Supervisor</option>
                  <option value="coordenador">Responsável pela foto: Coordenador</option>
                  <option value="tecnico">Responsável pela foto: Técnico</option>
                </select>
                <button onClick={() => setCriandoNova(false)}>Cancelar criação, buscar existente</button>
              </div>
            )}

            {isReatribuicao && (
              <input
                type="text"
                placeholder="Motivo da reatribuição (obrigatório)"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                style={{ width: '100%', marginBottom: 10 }}
              />
            )}

            {erro && <p style={{ fontSize: 12, color: 'var(--text-danger)', margin: '0 0 10px' }}>{erro}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1 }} onClick={() => setFrotaSelecionada(null)}>Cancelar</button>
              <button style={{ flex: 1, background: 'var(--fill-accent)', color: 'var(--on-accent)', border: 'none' }} onClick={confirmar}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
