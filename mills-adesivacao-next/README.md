# mills-adesivacao-next

Painel de acompanhamento de adesivação da frota Mills oriunda da NEXT.

## Stack
React 19 + Vite, hospedado no GitHub Pages. Backend no Firebase (Firestore + Auth) e fotos de evidência no Cloudinary (mesmo padrão do `mills-doc-portal`) — evita exigir o plano pago do Firebase Storage.

## Fluxo de status de uma frota
```
aguardando_atribuicao -> pendente -> [pendente_validacao_gestor] -> pendente_validacao_analista -> adesivado
```
A etapa `pendente_validacao_gestor` só existe para unidades onde
`responsavelApontamento = 'tecnico'` (ver `src/utils/statusFlow.js`).

## Telas
- `/apontamento/:token` — gestor ou técnico aponta a adesivação com foto (sem login, link fixo por unidade).
- `/validacao-gestor/:token` — gestor confirma fotos enviadas pelo técnico (sem login, link fixo).
- `/validacao` — fila de validação final do analista (login obrigatório).
- `/atribuicao` — analista atribui ou reatribui a unidade responsável por uma frota (login obrigatório).
- `/` — dashboard de progresso em cascata (Gerente → Coordenador → Supervisor → Encarregado), login obrigatório.

---

## Passo a passo de setup (local, sem Codespace)

### 1. Criar o repositório no GitHub
```bash
cd mills-adesivacao-next
git init
git add .
git commit -m "Scaffold inicial"
```
No GitHub, crie um repositório novo (público ou privado) chamado `mills-adesivacao-next`, **sem** README/gitignore (já temos os nossos). Depois:
```bash
git remote add origin https://github.com/SEU_USUARIO/mills-adesivacao-next.git
git branch -M main
git push -u origin main
```

### 2. Criar o projeto Firebase (novo e dedicado a este app)
No [Console Firebase](https://console.firebase.google.com):
1. **Criar projeto novo** — não reaproveitar o projeto do `mills-logistica`. Isso mantém os dois sistemas com Firestore e Auth totalmente isolados: nenhum risco de uma regra de segurança nova sobrescrever ou derrubar o acesso do que já está em produção.
2. Ativar **Firestore Database** (modo produção).
3. Ativar **Authentication** → método Email/senha (para o analista logar).
4. Em *Configurações do projeto* → *Geral* → *Seus apps* → criar um app Web. Copiar as credenciais (`apiKey`, `authDomain`, etc).

(Não usamos o Firebase Storage neste projeto — hoje ele exige plano pago mesmo em uso baixo. As fotos de evidência vão para o Cloudinary, configurado no passo 3.)

### 3. Criar a conta Cloudinary (gratuita) para as fotos
1. Acesse https://cloudinary.com e crie uma conta gratuita (mesmo serviço já usado no `mills-doc-portal`).
2. No painel, anote o **Cloud name** (aparece no topo do dashboard).
3. Vá em **Settings → Upload → Upload presets → Add upload preset**.
4. Defina **Signing Mode = Unsigned** (permite upload direto do navegador sem expor segredo).
5. Salve e anote o **nome do preset** criado.

### 4. Configurar variáveis de ambiente locais
```bash
cp .env.example .env.local
```
Preencher `.env.local` com as credenciais do Firebase (passo 2) e do Cloudinary (passo 3). Esse arquivo nunca é commitado (já está no `.gitignore`).

### 5. Rodar localmente
```bash
npm install
npm run dev
```
Abre em `http://localhost:5173`.

### 6. Subir as regras de segurança do Firestore
Instalar a CLI do Firebase (se ainda não tiver):
```bash
npm install -g firebase-tools
firebase login
firebase use --add   # selecionar o projeto criado no passo 2
firebase deploy --only firestore:rules
```

### 7. Configurar o GitHub Pages
No repositório do GitHub: **Settings → Pages → Source → GitHub Actions** (não "Deploy from a branch" — o workflow já incluso em `.github/workflows/deploy.yml` cuida disso).

### 8. Configurar os secrets do repositório
**Settings → Secrets and variables → Actions → New repository secret**, um para cada:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

(os mesmos valores do `.env.local`)

### 9. Deploy
Qualquer `git push` na branch `main` dispara o build e publica automaticamente em:
```
https://SEU_USUARIO.github.io/mills-adesivacao-next/
```

### 10. Criar o usuário analista
No Console Firebase → Authentication → Users → Add user (e-mail + senha). Depois, para liberar permissão de escrita nas regras, é preciso setar a custom claim `role: 'analista'` nesse usuário — ver pendência abaixo.

### 11. Importar a base inicial
```bash
# Service Account: Console Firebase > Configurações do projeto > Contas de serviço > Gerar nova chave
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json \
  node scripts/import_to_firestore.js ./unidades.json ./frotas_next.json
```
(coloque `unidades.json` e `frotas_next.json`, gerados pelo `merge_adesivacao_next.py`, na raiz do projeto antes de rodar)

---

## Pendências antes de produção
- **Custom claim `role: 'analista'`** — sem ela, as regras do Firestore não liberam escrita pro analista. Rodar um script simples com o Admin SDK (`auth.setCustomUserClaims(uid, { role: 'analista' })`) ou criar uma Cloud Function `onCreate` que faz isso automaticamente para e-mails `@mills.com.br`.
- **Resolução de token via Cloud Function** — hoje o client consulta `unidades` diretamente filtrando por token. Funciona para uso interno, mas para reduzir a superfície de leitura sem Auth, o ideal é mover essa resolução para uma Cloud Function com Admin SDK antes de expor os links publicamente.
- **17 pendências de de-para** (`pendencias_de_para.csv`) não bloqueiam nada — essas frotas entram com status `aguardando_atribuicao` e ficam disponíveis para atribuição manual em `/atribuicao`.
- Checar a exposição da chave da API do CallMeBot no `mills-logistica` (pendência já identificada anteriormente, em projeto Firebase separado deste).
