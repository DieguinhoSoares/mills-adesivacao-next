// Máquina de estados de uma frota NEXT no fluxo de adesivação.
//
// aguardando_atribuicao -> pendente -> [pendente_validacao_gestor] ->
//   pendente_validacao_analista -> adesivado
//
// O passo "pendente_validacao_gestor" só existe quando a unidade tem
// responsavelApontamento = 'tecnico' (ver unidades.responsavelApontamento).
// Nesse caso, quem tira a foto é o técnico e o gestor (encarregado/
// supervisor/coordenador definido em responsavelValidacaoIntermediaria)
// confirma antes de seguir para o analista.

export const STATUS = {
  AGUARDANDO_ATRIBUICAO: 'aguardando_atribuicao',
  PENDENTE: 'pendente',
  PENDENTE_VALIDACAO_GESTOR: 'pendente_validacao_gestor',
  PENDENTE_VALIDACAO_ANALISTA: 'pendente_validacao_analista',
  ADESIVADO: 'adesivado',
};

export function cadeiaValidacao(unidade) {
  if (!unidade) return [STATUS.PENDENTE, STATUS.PENDENTE_VALIDACAO_ANALISTA, STATUS.ADESIVADO];
  if (unidade.responsavelApontamento === 'tecnico') {
    return [
      STATUS.PENDENTE,
      STATUS.PENDENTE_VALIDACAO_GESTOR,
      STATUS.PENDENTE_VALIDACAO_ANALISTA,
      STATUS.ADESIVADO,
    ];
  }
  return [STATUS.PENDENTE, STATUS.PENDENTE_VALIDACAO_ANALISTA, STATUS.ADESIVADO];
}

export function proximoStatus(statusAtual, unidade) {
  const cadeia = cadeiaValidacao(unidade);
  const idx = cadeia.indexOf(statusAtual);
  if (idx === -1 || idx === cadeia.length - 1) return statusAtual;
  return cadeia[idx + 1];
}

// Quando uma etapa de validação rejeita, a frota volta para a etapa
// imediatamente anterior à validação que rejeitou (não para o início),
// preservando o trabalho de quem já apontou corretamente nas etapas
// anteriores.
export function statusAposRejeicao(statusAtual) {
  if (statusAtual === STATUS.PENDENTE_VALIDACAO_GESTOR) return STATUS.PENDENTE;
  if (statusAtual === STATUS.PENDENTE_VALIDACAO_ANALISTA) return STATUS.PENDENTE;
  return STATUS.PENDENTE;
}

export const STATUS_LABEL = {
  [STATUS.AGUARDANDO_ATRIBUICAO]: 'Aguardando atribuição',
  [STATUS.PENDENTE]: 'Pendente',
  [STATUS.PENDENTE_VALIDACAO_GESTOR]: 'Aguardando validação do gestor',
  [STATUS.PENDENTE_VALIDACAO_ANALISTA]: 'Aguardando validação do analista',
  [STATUS.ADESIVADO]: 'Adesivado',
};
