// Etapas do cronograma de regularização dos adesivos, na ordem do processo.
// Diferente do status de apontamento (foto/validação), isso acompanha a
// cadeia física do adesivo: comprar -> produzir -> aplicar.

export const ETAPAS = ['compras', 'producao', 'aguardando_aplicacao', 'finalizado'];

export const ETAPA_LABEL = {
  compras: 'Processo de Compras',
  producao: 'Em Produção',
  aguardando_aplicacao: 'Aguardando Aplicação',
  finalizado: 'Finalizado',
};

export const ETAPA_CORES = {
  compras: { bg: 'var(--surface-1)', fg: 'var(--text-secondary)' },
  producao: { bg: 'var(--bg-accent)', fg: 'var(--text-accent)' },
  aguardando_aplicacao: { bg: '#fdf3e0', fg: '#9a6b1f' },
  finalizado: { bg: 'var(--bg-success)', fg: 'var(--text-success)' },
};

export function etapaDaFrota(frota) {
  return frota.regularizacao?.etapa || 'compras';
}

export function diasDesde(iso) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}
