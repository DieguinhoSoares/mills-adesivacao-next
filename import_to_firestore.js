// Importa unidades.json e frotas_next.json para o Firestore.
// Limpa as coleções existentes antes de reimportar (evita duplicatas).
//
// Uso:
//   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json \
//     node import_to_firestore.js unidades.json frotas_next.json

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

async function limparColecao(nome) {
  console.log(`Limpando ${nome}…`);
  const snap = await db.collection(nome).get();
  const batchSize = 400;
  for (let i = 0; i < snap.docs.length; i += batchSize) {
    const batch = db.batch();
    snap.docs.slice(i, i + batchSize).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  console.log(`  ${snap.docs.length} registros removidos.`);
}

async function importarColecao(nome, registros) {
  const batchSize = 400;
  for (let i = 0; i < registros.length; i += batchSize) {
    const batch = db.batch();
    registros.slice(i, i + batchSize).forEach(({ id, ...dados }) => {
      batch.set(db.collection(nome).doc(id), dados);
    });
    await batch.commit();
    console.log(`${nome}: ${Math.min(i + batchSize, registros.length)}/${registros.length}`);
  }
}

async function main() {
  const unidades = JSON.parse(readFileSync(unidadesPath, 'utf-8'));
  const frotas   = JSON.parse(readFileSync(frotasPath,   'utf-8'));

  await limparColecao('unidades');
  await limparColecao('frotas_next');

  console.log(`\nImportando ${unidades.length} unidades…`);
  await importarColecao('unidades', unidades);

  console.log(`\nImportando ${frotas.length} frotas NEXT…`);
  await importarColecao('frotas_next', frotas);

  console.log('\nImportação concluída.');
}

main().catch((e) => { console.error(e); process.exit(1); });
