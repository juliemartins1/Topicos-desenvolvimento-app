
# Trabalho Prático II — Autenticação, Contexto e Rotas Protegidas

**Aluno(a):** Julie Martins Monteiro
**Disciplina:** Tópicod em Desenvolvimento de Aplicativos
**Vídeo de explicação:** [PREENCHER: link do vídeo — acesso liberado ao professor]

---

## 1. Como executar

### Servidor (Node.js + Express, dados em memória)

```bash
cd server
npm install
npm start
```

O servidor sobe em `http://localhost:3000` e lista as contas de teste no terminal.
(Opcional: `ATRASO=0 npm start` remove o atraso artificial de 400 ms.)

### App (Expo)

Em outro terminal, na raiz do projeto:

```bash
npm install
npx expo start
```

O app descobre o IP do servidor pelo Expo. Para apontar para outro endereço:
`EXPO_PUBLIC_API_URL=http://... npx expo start`.

### Contas de teste

| Papel | E-mail | Senha |
|---|---|---|
| admin | admin@ifrs.edu.br | admin123 |
| moderador | moderador@ifrs.edu.br | mod123 |
| usuario (Ana) | ana@ifrs.edu.br | 123456 |

Os dados vivem em memória: reiniciar o servidor apaga os cadastros e invalida todos os tokens.

---

## 2. Requisitos

### 4.1 Sessão expirada (401)

[PREENCHER: um parágrafo dizendo o que foi feito e em quais arquivos.]

**Onde o 401 é tratado (centralizado):** [PREENCHER: arquivo(s) e função(ões). Explique também por que o 401 do próprio login (senha errada) não desloga, e por que o 403 não passa por esse caminho.]

### 4.2 Estado `carregando` no contexto

[PREENCHER: um parágrafo dizendo o que foi feito e em quais arquivos.]

**Resposta — o erro do login se perde quando a tela sai da árvore?**
[PREENCHER: qual solução você escolheu (manter o `<Stack>` montado com a tela de espera por cima, ou levar o erro para o contexto) e por quê.]

### 4.3 Detalhes da anotação: `/anotacoes/[id]`

[PREENCHER: um parágrafo dizendo o que foi feito (servidor e app) e em quais arquivos.]

**Resposta — por que a rota fica dentro de `(app)`? O que aconteceria fora dele?**
[PREENCHER: lembre do `Stack.Protected` no layout raiz.]

### 4.4 Papel moderador

**Servidor.** Foram acrescentados o papel `moderador`, a conta `moderador@ifrs.edu.br / mod123` (criada ao subir o servidor e listada em `GET /`), o middleware reutilizável `somentePapeis(...)` (que substituiu o `somenteAdmin`) e a rota `GET /moderacao/anotacoes`, acessível só a moderador e admin (`usuario` recebe 403). `/usuarios` continua exclusiva do admin.

**App.** [PREENCHER: tela `/moderacao`, `Stack.Protected` para moderador e admin, link no início.]

**Arquivos alterados para acrescentar o papel:**

| Arquivo | Motivo |
|---|---|
| `server/banco.js` | Conta de teste do moderador e função `listarTodasAnotacoes()`, que junta cada anotação ao nome do autor. |
| `server/index.js` | Middleware `somentePapeis`, rota `GET /moderacao/anotacoes` e lista de rotas de `GET /`. |
| `src/models/usuario.ts` | [PREENCHER] |
| `src/services/api.ts` | [PREENCHER] |
| `src/app/(app)/_layout.tsx` | [PREENCHER] |
| `src/app/(app)/index.tsx` | [PREENCHER] |
| `src/app/(app)/moderacao.tsx` | [PREENCHER] |
| `src/components/...` | [PREENCHER: componente da lista de moderação] |
| `src/app/(auth)/login.tsx` | [PREENCHER: atalho da conta de moderador, se fez] |

### 4.5 Sessão que sobrevive ao reload

[PREENCHER: um parágrafo dizendo o que foi feito e em quais arquivos (chave usada no AsyncStorage, onde grava, onde apaga, como restaura).]

**Resposta — o que acontece quando o servidor está fora do ar na abertura do app (status 0)?**
[PREENCHER: a decisão que você tomou — o token é apagado ou mantido? O que o usuário vê? Justifique.]

### 4.6 Análise: funções recriadas a cada render

[PREENCHER: resposta em até uma página, cobrindo os quatro pontos abaixo.]

1. **Por que isso poderia ser um problema em um contexto?** [PREENCHER: quem re-renderiza quando o `value` muda de identidade?]
2. **É um problema neste projeto?** [PREENCHER: relacione com `"reactCompiler": true` no `app.json`.]
3. **Como seria resolvido sem o React Compiler?** [PREENCHER: `useCallback` e `useMemo`.]
4. **Evidência:** [PREENCHER: `console.log` em um leitor do contexto, Profiler ou teste com `reactCompiler` desligado — inclua números ou print.]

---

## 3. Screenshots

| Tela de espera | Detalhe de uma anotação |
|---|---|
| [PREENCHER: imagem] | [PREENCHER: imagem] |

| Tela de moderação | Aviso de sessão expirada no login |
|---|---|
| [PREENCHER: imagem] | [PREENCHER: imagem] |

---

## 4. Rotas do servidor

| Método | Rota | Acesso | Resposta |
|---|---|---|---|
| GET | `/` | público | informações do servidor, contas de teste e rotas |
| POST | `/auth/cadastro` | público | 201 `{ token, usuario }` |
| POST | `/auth/login` | público | 200 `{ token, usuario }`; 401 se credenciais erradas |
| GET | `/auth/me` | token | 200 usuário; 401 sem token válido |
| POST | `/auth/logout` | token | 204 |
| GET | `/anotacoes` | token | 200 lista das anotações do próprio usuário |
| POST | `/anotacoes` | token | 201 anotação criada |
| GET | `/anotacoes/:id` | token | 200 anotação; 401 sem token; 404 se não existe ou é de outra pessoa |
| GET | `/usuarios` | admin | 200 lista de usuários; 403 para os demais |
| GET | `/moderacao/anotacoes` | moderador ou admin | 200 todas as anotações com `autor`; 401 sem token; 403 para `usuario` |

> Confira a linha de `GET /anotacoes/:id`: só deixe se você implementou.

---

## 5. Organização do projeto

- `src/app/` — telas e layouts (Expo Router)
- `src/components/` — componentes reutilizáveis
- `src/contexts/` — `AuthProvider` e `useAuth`
- `src/services/` — `api.ts` (único lugar que chama `fetch`)
- `src/models/` — tipos TypeScript
- `server/index.js` — rotas e middlewares de acesso
- `server/banco.js` — acesso aos dados em memória