// Importa os arquivos gerados por merge_adesivacao_next.py para o Firestore.
//
// Uso:
//   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/import_to_firestore.js \
//     ../unidades.json ../frotas_next.json
//
// Requer uma Service Account com permissão de escrita no Firestore
// (Console Firebase > Configurações do projeto > Contas de serviço).

import { readFileSync } from 'fs';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const [, , unidadesPath, frotasPath] = process.argv;

if (!unidadesPath || !frotasPath) {
  console.error('Uso: node import_to_firestore.js <unidades.json> <frotas_next.json>');
  process.exit(1);
}

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function importarColecao(nomeColecao, registros, idField) {
  const batchSize = 400; // limite do Firestore é 500 por batch
  for (let i = 0; i < registros.length; i += batchSize) {
    const lote = registros.slice(i, i + batchSize);
    const batch = db.batch();
    lote.forEach((registro) => {
      const { [idField]: docId, ...dados } = registro;
      const ref = db.collection(nomeColecao).doc(docId);
      batch.set(ref, dados);
    });
    await batch.commit();
    console.log(`${nomeColecao}: ${Math.min(i + batchSize, registros.length)}/${registros.length}`);
  }
}

async function main() {
  const unidades = JSON.parse(readFileSync(unidadesPath, 'utf-8'));
  const frotas = JSON.parse(readFileSync(frotasPath, 'utf-8'));

  console.log(`Importando ${unidades.length} unidades…`);
  await importarColecao('unidades', unidades, 'id');

  console.log(`Importando ${frotas.length} frotas NEXT…`);
  await importarColecao('frotas_next', frotas, 'id');

  console.log('Importação concluída.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
