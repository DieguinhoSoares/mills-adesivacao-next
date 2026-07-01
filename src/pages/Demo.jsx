import { useState } from 'react';

const DEMO_UNIDADE = {
  unidade: 'SLC - Fazenda Planorte Sapezal',
  encarregado: 'Diego Passerini',
};

const DEMO_FROTAS = [
  { id: '1', idNext: 'MN218', numeroInterno: 'MNA04254', numeroSerie: 'CAT00120EE9201039', status: 'pendente', motivoRejeicao: null },
  { id: '2', idNext: 'MN219', numeroInterno: 'MNA04255', numeroSerie: 'CAT00120HE9201038', status: 'pendente', motivoRejeicao: 'Foto desfocada, não é possível identificar a máquina' },
  { id: '3', idNext: 'MN220', numeroInterno: 'MNA04256', numeroSerie: 'CAT00120CE9201026', status: 'pendente_validacao_analista', motivoRejeicao: null },
  { id: '4', idNext: 'MN221', numeroInterno: 'MNA04257', numeroSerie: 'CAT00120LE9201023', status: 'adesivado', motivoRejeicao: null },
  { id: '5', idNext: 'MN222', numeroInterno: 'MNA04258', numeroSerie: 'CAT00120LE9201068', status: 'adesivado', motivoRejeicao: null },
];

const STATUS_LABEL = {
  pendente: 'Pendente',
  pendente_validacao_gestor: 'Aguard. gestor',
  pendente_validacao_analista: 'Aguard. analista',
  adesivado: 'Concluído',
};

export default function Demo() {
  const [frotas, setFrotas] = useState(DEMO_FROTAS);
  const [busca, setBusca] = useState('');
  const [frotaAberta, setFrotaAberta] = useState(null);
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [observacao, setObservacao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const feitas = frotas.filter(f => f.status !== 'pendente').length;

  const lista = frotas.filter(f =>
    !busca || `${f.idNext}${f.numeroInterno}${f.numeroSerie}`.toLowerCase().includes(busca.toLowerCase())
  );

  function abrirFrota(f) {
    if (f.status !== 'pendente') return;
    setFrotaAberta(f);
    setFoto(null);
    setFotoPreview(null);
    setObservacao('');
    setSucesso(false);
  }

  function selecionarFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  function confirmar() {
    if (!foto) return;
    setEnviando(true);
    setTimeout(() => {
      setFrotas(prev => prev.map(f =>
        f.id === frotaAberta.id
          ? { ...f, status: 'pendente_validacao_analista', motivoRejeicao: null }
          : f
      ));
      setEnviando(false);
      setSucesso(true);
      setTimeout(() => {
        setFrotaAberta(null);
        setSucesso(false);
      }, 1500);
    }, 1200);
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '1rem', fontFamily: 'IBM Plex Sans, sans-serif' }}>

      {/* Banner demo */}
      <div style={{ background: '#004042', color: '#6bfac7', fontSize: 12, padding: '6px 12px', borderRadius: 8, marginBottom: 12, textAlign: 'center' }}>
        Modo demonstração — dados fictícios
      </div>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 12, color: '#5f5e5a', margin: 0 }}>Apontamento de adesivação</p>
          <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: '#1a1a18' }}>{DEMO_UNIDADE.unidade}</p>
          <p style={{ fontSize: 12, color: '#888780', margin: '2px 0 0' }}>{DEMO_UNIDADE.encarregado}</p>
        </div>
        <span style={{ background: '#fde3d2', color: '#c24003', fontSize: 12, padding: '4px 10px', borderRadius: 8, whiteSpace: 'nowrap' }}>
          {feitas} de {frotas.length} feitas
        </span>
      </div>

      {/* Busca */}
      <input
        type="text"
        placeholder="Buscar nº interno, série ou ID Next"
        value={busca}
        onChange={e => setBusca(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '0.5px solid #ccc', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }}
      />

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {lista.map(f => {
          const reprovado = f.status === 'pendente' && f.motivoRejeicao;
          const concluido = f.status === 'adesivado';
          const aguardando = f.status === 'pendente_validacao_analista';
          return (
            <div
              key={f.id}
              onClick={() => abrirFrota(f)}
              style={{
                border: `0.5px solid ${reprovado ? '#f09595' : '#ddd'}`,
                borderRadius: 8,
                padding: '10px 12px',
                background: reprovado ? '#fff5f5' : concluido ? '#f0faf5' : 'white',
                cursor: f.status === 'pendente' ? 'pointer' : 'default',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#1a1a18' }}>{f.idNext}</p>
                  <p style={{ fontSize: 12, color: '#888780', margin: '2px 0 0' }}>
                    Interno {f.numeroInterno} · Série {f.numeroSerie}
                  </p>
                </div>
                <span style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 8, whiteSpace: 'nowrap',
                  background: reprovado ? '#fde8e8' : concluido ? '#d9f5ea' : aguardando ? '#e8f0fd' : '#f5f4ee',
                  color: reprovado ? '#a32d2d' : concluido ? '#00595c' : aguardando ? '#1a4fa0' : '#5f5e5a',
                }}>
                  {reprovado ? '⚠ Reprovado' : STATUS_LABEL[f.status]}
                </span>
              </div>
              {reprovado && (
                <p style={{ fontSize: 12, color: '#a32d2d', margin: '6px 0 0', fontStyle: 'italic' }}>
                  Motivo: {f.motivoRejeicao} — toque para reenviar
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de apontamento */}
      {frotaAberta && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '16px 16px 0 0', padding: '1.5rem', width: '100%', maxWidth: 480 }}>

            {sucesso ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <p style={{ fontSize: 32, margin: '0 0 8px' }}>✅</p>
                <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: '#00595c' }}>Apontamento enviado!</p>
                <p style={{ fontSize: 13, color: '#888780', margin: '4px 0 0' }}>Aguardando validação da analista</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{frotaAberta.idNext}</p>
                    <p style={{ fontSize: 12, color: '#888780', margin: '2px 0 0' }}>
                      Interno {frotaAberta.numeroInterno} · Série {frotaAberta.numeroSerie}
                    </p>
                  </div>
                  <button onClick={() => setFrotaAberta(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888780', padding: 0 }}>✕</button>
                </div>

                {/* Preview da foto ou área de upload */}
                {fotoPreview ? (
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <img src={fotoPreview} alt="Preview" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 8 }} />
                    <button
                      onClick={() => { setFoto(null); setFotoPreview(null); }}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}
                    >✕</button>
                  </div>
                ) : (
                  <label style={{ display: 'block', marginBottom: 12 }}>
                    <div style={{ border: '1.5px dashed #ccc', borderRadius: 8, padding: '2rem', textAlign: 'center', cursor: 'pointer', background: '#fafaf8' }}>
                      <p style={{ fontSize: 28, margin: '0 0 6px' }}>📷</p>
                      <p style={{ fontSize: 14, color: '#5f5e5a', margin: 0 }}>Tirar foto da máquina adesivada</p>
                      <p style={{ fontSize: 12, color: '#888780', margin: '4px 0 0' }}>Toque para abrir a câmera</p>
                    </div>
                    <input type="file" accept="image/*" capture="environment" onChange={selecionarFoto} style={{ display: 'none' }} />
                  </label>
                )}

                <textarea
                  placeholder="Observação (opcional)"
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                  style={{ width: '100%', minHeight: 60, padding: '8px 10px', borderRadius: 8, border: '0.5px solid #ccc', fontSize: 14, marginBottom: 12, boxSizing: 'border-box', resize: 'none' }}
                />

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setFrotaAberta(null)}
                    style={{ flex: 1, padding: '12px', borderRadius: 8, border: '0.5px solid #ccc', background: 'white', fontSize: 14, cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmar}
                    disabled={!foto || enviando}
                    style={{
                      flex: 2, padding: '12px', borderRadius: 8, border: 'none',
                      background: foto && !enviando ? '#f37021' : '#ccc',
                      color: 'white', fontSize: 14, fontWeight: 600, cursor: foto && !enviando ? 'pointer' : 'default'
                    }}
                  >
                    {enviando ? 'Enviando…' : 'Confirmar adesivação'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
