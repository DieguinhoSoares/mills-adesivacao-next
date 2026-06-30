// Define a custom claim role: 'analista' para um usuário do Firebase Auth,
// liberando a escrita conforme as Firestore Rules do projeto.
//
// Uso (dentro do Google Cloud Shell, com a service account já no mesmo
// diretório):
//   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node set_analista.js seu-email@mills.com.br

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const email = process.argv[2];
if (!email) {
  console.error('Uso: node set_analista.js email@dominio.com');
  process.exit(1);
}

initializeApp({ credential: applicationDefault() });

async function main() {
  const user = await getAuth().getUserByEmail(email);
  await getAuth().setCustomUserClaims(user.uid, { role: 'analista' });
  console.log(`Pronto. ${email} agora tem role: 'analista'.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
