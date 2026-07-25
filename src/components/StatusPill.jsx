import { STATUS, STATUS_LABEL } from '../utils/statusFlow';

// Pares bg/texto do sistema unificado de status (ver styles.css :root).
const CORES = {
  [STATUS.AGUARDANDO_ATRIBUICAO]: { bg: 'var(--st-aguardando-bg)', fg: 'var(--st-aguardando-fg)' },
  [STATUS.PENDENTE]: { bg: 'var(--st-pendente-bg)', fg: 'var(--st-pendente-fg)' },
  [STATUS.PENDENTE_VALIDACAO_ANALISTA]: { bg: 'var(--st-analista-bg)', fg: 'var(--st-analista-fg)' },
  [STATUS.ADESIVADO]: { bg: 'var(--st-adesivado-bg)', fg: 'var(--st-adesivado-fg)' },
};

export function StatusPill({ status, reprovado }) {
  if (reprovado) {
    return (
      <span className="status-pill" style={{ background: 'var(--bg-danger)', color: 'var(--text-danger)' }}>
        ⚠ Reprovado
      </span>
    );
  }
  const cor = CORES[status] || CORES[STATUS.PENDENTE];
  return (
    <span className="status-pill" style={{ background: cor.bg, color: cor.fg }}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}
