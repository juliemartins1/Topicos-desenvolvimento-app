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

O servidor escuta na porta 3000 e mantém os dados em memória.

### Rodando no celular

**Pelo cabo USB (Android) — forma recomendada e testada:**

1. No celular, ative as Opções do desenvolvedor e a **Depuração USB**, conecte o cabo e aceite a mensagem "Permitir depuração USB".
2. Confira se o computador enxerga o aparelho: `adb devices` deve listar o celular com a palavra `device` (no Ubuntu, instale com `sudo apt install adb` se necessário).
3. Com o servidor rodando no Terminal 1, rode no Terminal 2, na pasta `Trabalho_2`:

```bash
adb reverse tcp:8081 tcp:8081
adb reverse tcp:3000 tcp:3000
npx expo start --localhost --android
```

O `adb reverse` cria um túnel pelo cabo: no celular, `127.0.0.1:8081` passa a ser o Expo do computador e `127.0.0.1:3000` passa a ser a API. O `--localhost` faz o Expo Go abrir `exp://127.0.0.1:8081` em vez do IP do Wi-Fi, então firewall e rede não interferem. O mesmo pode ser feito com `npm run celular-usb`.

Se o cabo for desconectado ou o celular reiniciar, rode os dois `adb reverse` de novo. Na primeira execução o bundle pode demorar alguns minutos.

**Pelo Wi-Fi (Expo Go):** celular e computador precisam estar na mesma rede. O app usa o IP que o Expo informa; se a mensagem de erro mostrar `127.0.0.1`, inicie o Expo informando o IP do computador:

```bash
EXPO_PUBLIC_API_URL=http://IP_DO_COMPUTADOR:3000 npx expo start
```

Para conferir a rede, abra `http://IP_DO_COMPUTADOR:3000` no navegador do celular: deve aparecer o JSON do servidor. Se não abrir, libere a porta no firewall (`sudo ufw allow 3000` no Ubuntu).

Se o servidor não responder em 8 segundos, o app mostra o erro de conexão em vez de ficar carregando indefinidamente.

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

**Resultado observado.** Com o log em `SessaoAtual`, executei o fluxo Perfil → Sair → Entrar com `reactCompiler` ligado e desligado:

| Ação | `reactCompiler: true` | `reactCompiler: false` |
|---|---|---|
| Abrir Perfil (`/perfil`) | 2 | 2 |
| Sair → tela de login (`/login`) | 2 | 2 |
| Entrar → Início (`/`) | 1 | 1 |

O número de renderizações foi o mesmo nas duas configurações. As renderizações acompanharam mudanças reais do contexto (usuário entrou ou saiu) e da rota, e não a recriação de `entrar`, `cadastrar` e `sair`. Concluo que, neste app pequeno, a recriação das funções não gera custo perceptível. Em um contexto com muitos consumidores, `useCallback` e `useMemo` (ou o React Compiler) evitariam renderizações desnecessárias. Após o teste, `reactCompiler` voltou a `true`.

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

Capturas feitas com o app em execução em um celular Android:

| Detalhe de uma anotação (4.3) | Início como Ana — sem Moderação (4.4) | Início como Moderadora — com Moderação (4.4) |
|---|---|---|
| <img src="docs/prints/detalhe-anotacao.jpg" width="220"> | <img src="docs/prints/inicio-ana.jpg" width="220"> | <img src="docs/prints/inicio-moderadora.jpg" width="220"> |

Na tela da Ana, o menu mostra apenas "Minhas anotações" e "Perfil"; para a moderadora aparece também "Moderação", e "Administração" continua escondida, pois é exclusiva do admin.

| Tela de espera ao restaurar a sessão (4.2/4.5) | Aviso de sessão expirada no login (4.1) |
|---|---|
| <img src="docs/prints/restaurando-sessao.jpg" width="220"> | <img src="docs/prints/sessao-expirada.jpg" width="220"> |

A tela "Restaurando sua sessão…" aparece ao abrir o app enquanto o token salvo é validado com `GET /auth/me`. O aviso de sessão expirada apareceu após reiniciar o servidor com o app logado: a requisição seguinte recebeu 401 e o app voltou sozinho ao login.

| Tela de moderação (4.4) |
|---|
| <img src="docs/prints/moderacao.jpg" width="220"> |

Logada como moderadora, a tela lista as anotações de todos os usuários com o nome do autor, vindas de `GET /moderacao/anotacoes`.

**Vídeo de explicação (até 10 minutos):** [inserir link com acesso liberado ao professor]. No vídeo, demonstrar o fluxo de login, a expiração/restauração da sessão e a diferença entre proteção visual do app e autorização do servidor.

### Teste de autorização para o vídeo

Faça login como Ana e copie o token exibido em Perfil. Em outro terminal, execute (substitua `TOKEN_DA_ANA` pelo token real):
```bash
curl -i http://localhost:3000/moderacao/anotacoes \
  -H 'Authorization: Bearer TOKEN_DA_ANA'
```
A resposta esperada é `403 Forbidden`. Para demonstrar, use o token de moderador/admin e compare com a resposta `200`.