import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { STATUS, proximoStatus, statusAposRejeicao } from '../utils/statusFlow';

// Real-time: a lista atualiza sozinha conforme outros usuários (gestor,
// técnico, analista) vão mudando status em paralelo, sem precisar dar refresh.
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

  async function apontar(frotaId, { fotoURL, apontadoPor, observacao, unidade }) {
    const novoStatus = proximoStatus(STATUS.PENDENTE, unidade);
    await updateDoc(doc(db, 'frotas_next', frotaId), {
      status: novoStatus,
      fotoEvidenciaURL: fotoURL,
      apontadoPor,
      observacaoApontamento: observacao || null,
      dataApontamento: new Date().toISOString(),
      // Limpa rejeição anterior ao reenviar
      motivoRejeicao: null,
      rejeitadoPor: null,
      rejeitadoNivel: null,
      dataRejeicao: null,
    });
  }

  async function validarGestor(frotaId, { validadoPor, unidade }) {
    const novoStatus = proximoStatus(STATUS.PENDENTE_VALIDACAO_GESTOR, unidade);
    await updateDoc(doc(db, 'frotas_next', frotaId), {
      status: novoStatus,
      validadoGestorPor: validadoPor,
      dataValidacaoGestor: new Date().toISOString(),
    });
  }

  async function validarAnalista(frotaId, { validadoPor, unidade }) {
    const novoStatus = proximoStatus(STATUS.PENDENTE_VALIDACAO_ANALISTA, unidade);
    await updateDoc(doc(db, 'frotas_next', frotaId), {
      status: novoStatus,
      validadoAnalistaPor: validadoPor,
      dataValidacaoAnalista: new Date().toISOString(),
    });
  }

  async function rejeitar(frotaId, { statusAtual, motivo, rejeitadoPor }) {
    // rejeitadoNivel indica de qual etapa veio a rejeição,
    // para que a tela de quem apontou mostre o badge correto.
    const rejeitadoNivel = statusAtual === STATUS.PENDENTE_VALIDACAO_ANALISTA
      ? 'analista'
      : 'gestor';
    await updateDoc(doc(db, 'frotas_next', frotaId), {
      status: statusAposRejeicao(statusAtual),
      motivoRejeicao: motivo,
      rejeitadoPor,
      rejeitadoNivel,
      dataRejeicao: new Date().toISOString(),
      // Limpa a confirmação do gestor se a analista rejeitou,
      // forçando revalidação do gestor também.
      ...(rejeitadoNivel === 'analista' ? {
        validadoGestorPor: null,
        dataValidacaoGestor: null,
      } : {}),
    });
  }

  // Atribuição inicial (frota estava aguardando_atribuicao) ou
  // reatribuição de uma frota já em andamento (exige motivo).
  async function atribuirUnidade(frotaId, { unidadeId, atribuidoPor, motivo, statusAtual }) {
    const isReatribuicao = statusAtual && statusAtual !== STATUS.AGUARDANDO_ATRIBUICAO;
    if (isReatribuicao && !motivo) {
      throw new Error('Motivo é obrigatório para reatribuir uma frota já em andamento.');
    }
    const novoStatus = statusAtual === STATUS.AGUARDANDO_ATRIBUICAO ? STATUS.PENDENTE : statusAtual;
    await updateDoc(doc(db, 'frotas_next', frotaId), {
      unidadeId,
      status: novoStatus,
      historicoAtribuicao: arrayUnion({
        unidadeIdAnterior: null,
        unidadeIdNova: unidadeId,
        motivo: motivo || null,
        atribuidoPor,
        data: new Date().toISOString(),
      }),
    });
  }

  return { frotas, loading, apontar, validarGestor, validarAnalista, rejeitar, atribuirUnidade };
}
