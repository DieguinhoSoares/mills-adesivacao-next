import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { STATUS, proximoStatus, statusAposRejeicao } from '../utils/statusFlow';

// Real-time: a lista atualiza sozinha conforme outros usuários (técnico,
// analista) vão mudando status em paralelo, sem precisar dar refresh.
export function useFrotas() {
  const [frotas, setFrotas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'frotas_next'), (snap) => {
      setFrotas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  async function apontar(frotaId, { fotoURL, apontadoPor, observacao }) {
    await updateDoc(doc(db, 'frotas_next', frotaId), {
      status: proximoStatus(STATUS.PENDENTE),
      fotoEvidenciaURL: fotoURL,
      apontadoPor,
      observacaoApontamento: observacao || null,
      dataApontamento: new Date().toISOString(),
      // Limpa rejeição anterior ao reenviar
      motivoRejeicao: null,
      rejeitadoPor: null,
      dataRejeicao: null,
    });
  }

  async function validarAnalista(frotaId, { validadoPor }) {
    await updateDoc(doc(db, 'frotas_next', frotaId), {
      status: proximoStatus(STATUS.PENDENTE_VALIDACAO_ANALISTA),
      validadoAnalistaPor: validadoPor,
      dataValidacaoAnalista: new Date().toISOString(),
    });
  }

  async function rejeitar(frotaId, { statusAtual, motivo, rejeitadoPor }) {
    await updateDoc(doc(db, 'frotas_next', frotaId), {
      status: statusAposRejeicao(statusAtual),
      motivoRejeicao: motivo,
      rejeitadoPor,
      dataRejeicao: new Date().toISOString(),
    });
  }

  // Atribuição inicial (frota estava aguardando_atribuicao) ou
  // reatribuição de uma frota já em andamento (exige motivo).
  async function atribuirUnidade(frotaId, { unidadeId, unidadeIdAnterior, atribuidoPor, motivo, statusAtual }) {
    const isReatribuicao = statusAtual && statusAtual !== STATUS.AGUARDANDO_ATRIBUICAO;
    if (isReatribuicao && !motivo) {
      throw new Error('Motivo é obrigatório para reatribuir uma frota já em andamento.');
    }
    const novoStatus = statusAtual === STATUS.AGUARDANDO_ATRIBUICAO ? STATUS.PENDENTE : statusAtual;
    await updateDoc(doc(db, 'frotas_next', frotaId), {
      unidadeId,
      status: novoStatus,
      historicoAtribuicao: arrayUnion({
        unidadeIdAnterior: unidadeIdAnterior || null,
        unidadeIdNova: unidadeId,
        motivo: motivo || null,
        atribuidoPor,
        data: new Date().toISOString(),
      }),
    });
  }

  // Move uma ou várias frotas para uma etapa do cronograma de regularização,
  // registrando data e autor de cada transição para compor o histórico.
  async function atualizarRegularizacao(frotaIds, { etapa, atualizadoPor }) {
    const agora = new Date().toISOString();
    const ids = Array.isArray(frotaIds) ? frotaIds : [frotaIds];
    for (let i = 0; i < ids.length; i += 400) {
      const batch = writeBatch(db);
      ids.slice(i, i + 400).forEach((id) => {
        batch.update(doc(db, 'frotas_next', id), {
          'regularizacao.etapa': etapa,
          'regularizacao.atualizadoEm': agora,
          'regularizacao.atualizadoPor': atualizadoPor,
          'regularizacao.historico': arrayUnion({ etapa, data: agora, por: atualizadoPor }),
        });
      });
      await batch.commit();
    }
  }

  return { frotas, loading, apontar, validarAnalista, rejeitar, atribuirUnidade, atualizarRegularizacao };
}
