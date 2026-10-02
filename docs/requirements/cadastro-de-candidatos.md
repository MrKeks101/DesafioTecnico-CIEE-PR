# Cadastro de candidatos — manual, listagem e detalhe

Cobre `specs.md` linhas 7-21 ("Imagine que nossa equipe de recrutamento...",
"Dados do cadastro") e linhas 29-37 ("Requisitos da aplicação").

## Descrição

Um candidato é cadastrado por um formulário único, que também é o destino do
preenchimento automático via PDF (feature separada, ver
`importacao-pdf.md`). Depois de salvo, o candidato aparece em uma listagem e
pode ser aberto em uma tela de detalhe. Não há edição nem exclusão — o
desafio só pede cadastro, listagem e consulta (specs.md linha 11: "o
candidato deve aparecer em uma listagem, com acesso a uma tela de
detalhes").

Este documento cobre o modelo de dados, a validação compartilhada, e os três
endpoints/telas do caminho manual (criar, listar, detalhar). A extração via
PDF é tratada em `importacao-pdf.md`, mas ambas as features **convergem no
mesmo schema de validação e no mesmo endpoint de criação** — esse é o
mecanismo que garante "mesmo formulário, mesmas regras de validação"
(specs.md linha 11) por construção, não por disciplina.

## Modelo de dados (Candidate)

| Campo           | Tipo             | Obrigatório | Fonte em specs.md |
|-----------------|------------------|-------------|--------------------|
| id              | Int autoincrement | gerado     | — |
| fullName        | string           | sim         | linha 17 "Nome completo — obrigatório" |
| email           | string (formato e-mail) | sim  | linha 18 "E-mail — obrigatório" |
| phone           | string           | não         | linha 19 "Telefone." |
| areaOfInterest  | string           | não         | linha 20 "Área ou cargo de interesse." |
| summary         | string (texto longo) | não    | linha 21 "Resumo profissional." |
| createdAt       | datetime, default now | gerado | — (necessário para ordenar a listagem) |

Só `fullName` e `email` levam "— obrigatório" explicitamente em specs.md;
os demais são opcionais por omissão.

Nomes de campo em inglês no código (`fullName`, `areaOfInterest`, etc.) —
rótulos na interface ficam em português, público-alvo é recrutador
brasileiro.

## Requisitos funcionais

1. O schema de validação (Zod) vive em `packages/shared` e é a única fonte
   de regras de validação, importada tanto pelo formulário React quanto
   pelo endpoint Express de criação (decisão em `PROJECT.md`, linha
   "Validação com Zod em schema compartilhado").
2. `fullName`: obrigatório, string não vazia após `trim()`.
3. `email`: obrigatório, deve ter formato de e-mail válido (specs.md linha
   35: "Validação... do formato do e-mail").
4. `phone`, `areaOfInterest`, `summary`: opcionais; quando ausentes, são
   persistidos como vazio/nulo, nunca bloqueiam o cadastro.
5. `POST /api/candidates` valida o corpo contra o schema compartilhado;
   em caso de falha, responde `400` com mensagem clara por campo
   (specs.md linha 37, "mensagens claras"); em caso de sucesso, persiste via
   Prisma e responde `201` com o candidato criado e uma confirmação de
   "cadastro salvo".
6. `GET /api/candidates` retorna a lista de candidatos ordenada por
   `createdAt` desc (mais recentes primeiro). Sem paginação no MVP (ver
   Questões abertas).
7. `GET /api/candidates/:id` retorna o candidato completo (incluindo
   `summary`) ou `404` com mensagem clara se o id não existir.
8. A tela de listagem consome `GET /api/candidates` e cada item leva a uma
   tela de detalhe que consome `GET /api/candidates/:id`.
9. O estado vazio da listagem (nenhum candidato cadastrado ainda) e o
   estado de erro de rede mostram mensagens claras, nunca uma tela em
   branco ou travada.
10. Estrutura do banco criada via migration do Prisma, versionada em
    `prisma/migrations/`, aplicável contra o SQL Server do
    `docker-compose.yml` (specs.md linha 34: "Scripts ou migrations para
    criar a estrutura do banco").

## Non-goals

- Edição ou exclusão de candidatos — não pedido em specs.md.
- Autenticação/autorização — não pedida em specs.md.
- Paginação, busca ou filtros na listagem — não pedidos; MVP lista tudo.
- Unicidade de e-mail (impedir cadastros duplicados) — não pedida; duas
  pessoas podem ter o mesmo e-mail cadastrado duas vezes neste MVP.
- Deep-linking por URL para cada tela (rotas de navegador) — ver questão
  aberta abaixo sobre navegação do frontend.
- Upload/armazenamento do PDF em si (o binário) — só os campos extraídos
  são persistidos; ver `importacao-pdf.md`.

## Questões abertas (com default)

- **Paginação na listagem:** specs.md não exige. Default: sem paginação,
  lista completa ordenada por data. Revisitar se o volume de dados de teste
  tornar a listagem lenta.
- **Formato/máscara de telefone:** specs.md só exige validação de formato
  para e-mail (linha 35). Default: `phone` é texto livre opcional, sem regex
  de formato, para não rejeitar formatos válidos mas pouco usuais (DDI,
  ramal, etc.).
- **Navegação do frontend (rotas de URL vs. estado local):** nenhuma
  dependência de router (`react-router` etc.) está instalada no scaffold, e
  o escopo combinado no kickoff é não adicionar dependências novas. Default:
  navegação por estado React dentro de um único `App` (sem URLs profundas
  por tela); se sobrar tempo, pode evoluir para `react-router` em um ticket
  de polimento — não crítico para os critérios de avaliação.
- **Tipo do `id`:** Default: `Int` autoincrement (URLs de detalhe mais
  legíveis, ex. `/api/candidates/3`), em vez de UUID/cuid.
