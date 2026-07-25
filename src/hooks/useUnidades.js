import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useUnidades() {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getDocs(collection(db, 'unidades')).then((snap) => {
      if (!mounted) return;
      setUnidades(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function criarUnidade(novaUnidade) {
    const ref = await addDoc(collection(db, 'unidades'), {
      ...novaUnidade,
      tokenApontamento: crypto.randomUUID(),
    });
    const criada = { id: ref.id, ...novaUnidade };
    setUnidades((prev) => [...prev, criada]);
    return criada;
  }

  async function atualizarUnidade(unidadeId, dados) {
    await updateDoc(doc(db, 'unidades', unidadeId), dados);
    setUnidades((prev) => prev.map((u) => (u.id === unidadeId ? { ...u, ...dados } : u)));
  }

  return { unidades, loading, criarUnidade, atualizarUnidade };
}
