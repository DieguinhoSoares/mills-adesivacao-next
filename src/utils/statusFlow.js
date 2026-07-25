// Máquina de estados de uma frota NEXT no fluxo de adesivação.
//
// aguardando_atribuicao -> pendente -> pendente_validacao_analista -> adesivado
//
// Quem tira a foto (técnico, encarregado, supervisor ou coordenador,
// conforme unidades.responsavelApontamento) envia direto para a analista validar.

export const STATUS = {
  AGUARDANDO_ATRIBUICAO: 'aguardando_atribuicao',
  PENDENTE: 'pendente',
  PENDENTE_VALIDACAO_ANALISTA: 'pendente_validacao_analista',
  ADESIVADO: 'adesivado',
};

const CADEIA = [STATUS.PENDENTE, STATUS.PENDENTE_VALIDACAO_ANALISTA, STATUS.ADESIVADO];

export function proximoStatus(statusAtual) {
  const idx = CADEIA.indexOf(statusAtual);
  if (idx === -1 || idx === CADEIA.length - 1) return statusAtual;
  return CADEIA[idx + 1];
}

// Quando a analista rejeita, a frota volta para pendente (apontamento),
// já que é a única etapa de validação existente hoje.
export function statusAposRejeicao(statusAtual) {
  const idx = CADEIA.indexOf(statusAtual);
  if (idx <= 0) return STATUS.PENDENTE;
  return CADEIA[idx - 1];
}

export const STATUS_LABEL = {
  [STATUS.AGUARDANDO_ATRIBUICAO]: 'Aguardando atribuição',
  [STATUS.PENDENTE]: 'Pendente',
  [STATUS.PENDENTE_VALIDACAO_ANALISTA]: 'Aguardando validação do analista',
  [STATUS.ADESIVADO]: 'Adesivado',
};
