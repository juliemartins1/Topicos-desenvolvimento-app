# Trabalho Prático II — Autenticação, Contexto e Rotas Protegidas

**Aluna:** Julie Monteiro  
**Disciplina:** Desenvolvimento de Aplicativos

## Como executar

Requisitos: Node.js e npm instalados. Abra dois terminais na pasta `Trabalho_2`.

**Terminal 1 — API:**
```bash
cd server
npm install
npm start
```

**Terminal 2 — Expo:**
```bash
npm install
npx expo start
```

O servidor escuta na porta 3000 e mantém os dados em memória. O app identifica o IP do computador pelo Expo; celular e computador devem estar na mesma rede Wi-Fi. Se necessário, configure `EXPO_PUBLIC_API_URL=http://IP_DO_COMPUTADOR:3000` antes de iniciar o Expo.

### Contas de teste

| E-mail | Senha | Papel |
|---|---|---|
| `ana@ifrs.edu.br` | `123456` | usuario |
| `moderador@ifrs.edu.br` | `mod123` | moderador |
| `admin@ifrs.edu.br` | `admin123` | admin |

Reiniciar o servidor apaga usuários cadastrados durante o uso, anotações e tokens; as contas de teste e as anotações iniciais da Ana são recriadas.

## Requisitos implementados

### 4.1 — Sessão expirada (401)
O tratamento foi centralizado em `src/services/api.ts`: a função comum de requisição chama o callback registrado quando uma requisição com token recebe 401. O `AuthProvider`, em `src/contexts/auth-context.tsx`, limpa a sessão, apaga o AsyncStorage e marca `sessaoExpirada`; o layout raiz troca para o grupo de autenticação porque o estado mudou, sem `router.replace()`. Um 403 não aciona o callback e permanece como erro de permissão. A tela `src/app/(auth)/login.tsx` mostra “Sua sessão expirou. Entre novamente.” O logout voluntário limpa esse aviso.

### 4.2 — Estado carregando
`carregando` pertence ao `AuthContext` e fica verdadeiro durante login/cadastro. `src/components/tela-de-espera.tsx` fornece o indicador e a mensagem, usados nas telas de autenticação. A tela de login mantém seus estados locais enquanto apenas troca condicionalmente o conteúdo renderizado pela espera; assim, quando a requisição falha, o componente continua montado e a mensagem de erro permanece. O erro é tratado com `instanceof ApiError`.

### 4.3 — Detalhe de anotação
A antiga `src/app/(app)/anotacoes.tsx` foi reorganizada em `src/app/(app)/anotacoes/index.tsx`, e `src/app/(app)/anotacoes/[id].tsx` implementa o detalhe. `src/components/anotacao-item.tsx` permite tocar no item; o identificador é passado como parâmetro e a tela busca os dados novamente por `api.buscarAnotacao`, em `src/services/api.ts`. O servidor implementa `GET /anotacoes/:id` em `server/index.js`, usando `banco.buscarAnotacao` em `server/banco.js`, que responde 404 tanto para item inexistente quanto para item de outra pessoa. O detalhe mostra espera, erro (incluindo 404) ou texto/data formatada.

A rota fica dentro de `(app)` porque o grupo representa as telas que só existem com uma sessão autenticada. Assim, o `Stack.Protected` do layout raiz protege também o detalhe. Se estivesse fora do grupo, não herdaria a proteção interna do grupo logado e seria necessário configurar uma proteção própria; a tela poderia ficar acessível na árvore de navegação para quem não está autenticado, embora o servidor ainda devesse rejeitar a requisição sem token.

### 4.4 — Papel moderador
O tipo `Papel` em `src/models/usuario.ts` inclui `moderador`. `server/banco.js` cria a conta de teste e reúne as anotações com o nome do autor; `server/index.js` usa o middleware reutilizável `somentePapeis` para proteger `GET /moderacao/anotacoes` para moderador/admin. A tela `src/app/(app)/moderacao.tsx` lista as anotações e autores. `src/app/(app)/_layout.tsx` protege a rota para moderador e admin, mantendo `/admin` exclusivo do admin. `src/app/(app)/index.tsx` mostra o link de moderação apenas para esses papéis e `src/app/(auth)/login.tsx` inclui atalho para preencher a conta de moderadora.

Arquivos alterados para acrescentar/usar o papel:
- `server/banco.js`: cria a conta moderadora e expõe as anotações de todos com autor.
- `server/index.js`: lista a conta/rota e exige `moderador` ou `admin` no middleware.
- `src/models/usuario.ts`: acrescenta `moderador` ao tipo `Papel` e o autor opcional no tipo de anotação.
- `src/app/(app)/_layout.tsx`: restringe a tela de moderação aos papéis permitidos.
- `src/app/(app)/index.tsx`: exibe o link conforme o papel.
- `src/app/(app)/moderacao.tsx`: apresenta a lista de moderação.
- `src/app/(auth)/login.tsx`: oferece o atalho para preencher a conta de moderadora.
- `src/services/api.ts`: adiciona a chamada autenticada à rota de moderação.

### 4.5 — Sessão persistente
`src/services/api.ts` usa `@react-native-async-storage/async-storage` para ler, salvar e apagar a sessão. Login/cadastro salvam a sessão; logout e 401 apagam. Ao abrir o app, `AuthProvider` lê a sessão e chama `GET /auth/me`. O estado `restaurando` mantém uma tela de espera no layout raiz até terminar a validação, impedindo que o login apareça brevemente antes da decisão.

Se o servidor estiver fora do ar durante a abertura, a requisição falha com `ApiError` de status `0`. O app não assume que o token é válido e mostra o login, mas preserva o token salvo para permitir uma nova tentativa em uma próxima abertura. Somente um 401 confirma que a sessão deixou de ser válida e remove o token.

### 4.6 — Funções recriadas a cada render
Quando o `value` de um contexto muda por identidade, React re-renderiza os componentes consumidores que usam aquele contexto, mesmo que alguns campos tenham o mesmo conteúdo. Neste projeto, o `AuthProvider` recria `entrar`, `cadastrar`, `sair` e o objeto `value` a cada renderização. O `app.json` tem `experiments.reactCompiler: true`, portanto o React Compiler pode otimizar funções e valores automaticamente; isso não significa que toda renderização adicional desapareça em qualquer cenário e deve ser observado, não presumido.

Sem o React Compiler, envolveria as funções em `useCallback` com suas dependências e montaria o objeto do contexto com `useMemo`, também com dependências corretas. Como evidência inicial, `src/components/sessao-atual.tsx` registra no console `[evidência Context API] SessaoAtual renderizou` com a rota e o papel atual. Faça login e observe o terminal; depois desative `reactCompiler` em `app.json`, reinicie o Expo limpando o cache (`npx expo start -c`) e compare. O log indica renderizações, mas não prova sozinho que elas causam lentidão; o Profiler seria a medida mais completa.

## Tabela de rotas do servidor

| Método | Rota | Autenticação/permissão | Resposta principal |
|---|---|---|---|
| GET | `/` | pública | lista contas de teste e rotas |
| POST | `/auth/cadastro` | pública | cria usuário e sessão (201) |
| POST | `/auth/login` | pública | inicia sessão |
| GET | `/auth/me` | token válido | usuário atual |
| POST | `/auth/logout` | token válido | encerra sessão (204) |
| GET | `/anotacoes` | token válido | anotações do usuário |
| POST | `/anotacoes` | token válido | cria anotação (201) |
| GET | `/anotacoes/:id` | token válido | anotação própria ou 404 |
| GET | `/usuarios` | admin | lista usuários e contagens; 403 para outros papéis |
| GET | `/moderacao/anotacoes` | moderador ou admin | todas as anotações com autor; 403 para usuario |

## Evidências e vídeo

Adicionar aqui as capturas feitas com o app em execução:
- [ ] Tela de espera durante login/restauração.
- [ ] Detalhe de uma anotação.
- [ ] Tela de moderação.
- [ ] Aviso de sessão expirada no login.

**Vídeo de explicação (até 10 minutos):** [inserir link com acesso liberado ao professor]. No vídeo, demonstrar o fluxo de login, a expiração/restauração da sessão e a diferença entre proteção visual do app e autorização do servidor.

### Teste de autorização para o vídeo

Faça login como Ana e copie o token exibido em Perfil. Em outro terminal, execute (substitua `TOKEN_DA_ANA` pelo token real):
```bash
curl -i http://localhost:3000/moderacao/anotacoes \
  -H 'Authorization: Bearer TOKEN_DA_ANA'
```
A resposta esperada é `403 Forbidden`. Para demonstrar, use o token de moderador/admin e compare com a resposta `200`.
