# DesafioTecnico-CIEE-PR — Project & Workflow

## What this is

Desafio técnico da CIEE/PR para a vaga de Desenvolvedor de Sistemas: uma
aplicação de **cadastro de currículos**, com dois caminhos de entrada
(formulário manual e upload de PDF com extração automática de nome/e-mail/
telefone) que convergem no mesmo formulário e nas mesmas regras de validação,
além de listagem e tela de detalhes dos candidatos cadastrados.

A especificação completa está em `specs.md` (não editar — é o enunciado
original do desafio). Este documento é o acordo de trabalho de como vamos
construir a solução.

**Prazo:** domingo, 04/10/2026, 23h59.

## Principles

- **Simples e funcional antes de completo.** O próprio desafio pede uma
  "solução simples, funcional e que você consiga compreender e evoluir" — não
  over-engineering dentro de um prazo de poucos dias.
- **Uma única fonte de validação.** Cadastro manual e cadastro via PDF usam o
  mesmo formulário e as mesmas regras de validação — garantido por construção
  (schema Zod compartilhado), não por disciplina entre dois lugares diferentes.
- **PDF é estritamente opcional.** Ausência de arquivo ou falha de leitura
  nunca pode impedir o cadastro manual.
- **Write it down.** Decisões com impacto duradouro são registradas no log de
  [Decisões](#decisions) abaixo — é a partir dele que o `DESENVOLVIMENTO.md`
  final (exigido pela entrega) é escrito.
- **Green main.** `main` sempre com a suíte de testes passando.

## Repository layout

```
/                    repo root
README.md            requisitos + comandos de setup/execução/testes (entrega)
DESENVOLVIMENTO.md   relato do desenvolvimento + uso de IA (entrega, escrito
                      a partir deste PROJECT.md e das notas de sessão)
PROJECT.md           este arquivo — workflow & acordo de trabalho
specs.md             enunciado original do desafio (referência, não editar)
docker-compose.yml   SQL Server local para dev/avaliação
package.json         raiz do npm workspaces
frontend/            app React (TypeScript)
backend/             API Express (TypeScript)
packages/shared/     schemas Zod compartilhados por frontend e backend
prisma/              schema.prisma + migrations do SQL Server
docs/
  requirements/      análise de domínio e requisitos por feature (PM)
  tickets/           tickets para o agente Developer (PM)
samples/             currículo fictício em PDF para testar a importação
.claude/agents/      definições dos agentes (Project Manager, Developer)
```

## Tech stack

- **Linguagem:** TypeScript em todo o projeto (frontend, backend, schema
  compartilhado).
- **Frontend:** React.
- **Backend:** Node.js + Express.
- **ORM / migrations:** Prisma.
- **Banco de dados:** SQL Server, via Docker Compose em desenvolvimento.
- **Extração de texto do PDF:** `pdf-parse`.
- **Validação:** Zod, em um pacote compartilhado (`packages/shared`) consumido
  tanto pelo formulário React quanto pelos endpoints Express.
- **Testes:** Vitest (+ React Testing Library no frontend, `supertest` no
  backend).
- **Monorepo:** npm workspaces.

## Roles & agent workflow

Quatro papéis. Dois são agentes de IA, dois são o humano (Luiz).

### Project Manager (agente)

- Lê `specs.md` e este `PROJECT.md`.
- Escreve requisitos em `docs/requirements/<feature>.md`.
- Quebra o trabalho em tickets pequenos em `docs/tickets/`, cada um cabendo em
  um ciclo de desenvolvimento, com critérios de aceite claros.
- Não escreve código de produção.

### Developer (agente)

- Pega um ticket e implementa a feature ou correção.
- Cria/atualiza testes Vitest para toda mudança.
- Roda a suíte local e só entrega quando ela passa.
- Reporta contra os critérios de aceite do ticket.

### Stakeholder (humano — Luiz)

- Dono da visão e prioridades; decide o que é construído e em que ordem.
- Esclarece dúvidas de domínio que o PM levantar.

### QA (humano — Luiz)

- Faz teste exploratório/integração na aplicação rodando.
- Uma feature só é **aprovada quando Luiz disser.** Nenhum agente marca um
  ticket como concluído; o Developer marca "ready for QA".

### Flow

```
Stakeholder define o objetivo (specs.md + decisões)
      │
      ▼
Project Manager ── requisitos ──▶ tickets (docs/tickets/)
      │
      ▼
Developer ── implementa + testa ──▶ suíte local passa ──▶ "ready for QA"
      │
      ▼
QA (Luiz) ── teste de integração ──▶ aprova │ devolve com notas
      │
   aprovado
      ▼
   merge
```

## Git workflow

Branches de feature com pull requests.

### Branch naming

```
feat/<descrição-curta>      nova feature
fix/<descrição-curta>       correção de bug
chore/<descrição-curta>     tooling, deps, config
docs/<descrição-curta>      apenas documentação
```

### Cycle

1. Partir de uma `main` atualizada.
2. Criar uma branch: `git switch -c feat/cadastro-manual`.
3. Commits focados, estilo conventional-commit.
4. Push e abrir PR contra `main`.
5. Suíte local de testes precisa passar.
6. QA (Luiz) aprova.
7. Merge. Deletar a branch.

### Commit messages

```
<type>: <resumo no imperativo>

<corpo opcional: o quê e por quê, não como>
```

Tipos: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.

## Testing

- O desafio avalia "relevância dos testes", não exige um número de cobertura
  — por isso não fixamos um `--coverage` mínimo, mas toda lógica de negócio
  (validação, matching de nome/e-mail/telefone no texto do PDF, regras de
  cadastro) ganha testes.
- Testes de unidade com Vitest; endpoints HTTP com `supertest`.
- Teste de integração manual (exploratório) é feito por QA (Luiz) na aplicação
  rodando via Docker Compose.

## CI/CD

Fora de escopo dado o prazo do desafio. Não exigido pela especificação.

## Working cadence

Dado o prazo curto (até domingo 04/10 23h59):

1. Stakeholder define o próximo item.
2. PM produz requisitos + tickets.
3. Developer trabalha os tickets em sequência: branch, implementa, testa, PR.
4. QA testa e aprova.
5. Se uma sessão terminar no meio de um ticket, deixar a branch com nota no PR
   do que falta — e registrar como pendência no `DESENVOLVIMENTO.md` final, se
   o prazo não permitir concluir tudo.

## Decisions

Log de escolhas com impacto duradouro. Mais recentes primeiro. Esta tabela é
a base do `DESENVOLVIMENTO.md` final.

| Date       | Decision                                                        | Why |
|------------|------------------------------------------------------------------|-----|
| 2026-10-02 | `prisma` e `@prisma/client` fixados em `6.12.0` (versão exata, não `^6.12.0`) | A versão mais recente do `prisma` (8.x RC, resolvida por um `npm install` sem pin) trazia `@prisma/composer-cli` como dependência obrigatória — um recurso de deploy em nuvem que arrasta `alchemy` e `workerd` (runtime do Cloudflare Workers), dezenas de MB e 8 vulnerabilidades altas conhecidas (incluindo um bypass de autorização). A 6.12.0 é a última versão sem essa árvore e sem a vulnerabilidade de stack-exhaustion do `deepmerge-ts` que aparece em `@prisma/config` a partir de versões posteriores — nenhum desses recursos é usado neste projeto, e o pin exato evita que um `npm install` futuro suba de novo para uma versão vulnerável |
| 2026-10-01 | Stack de testes: Vitest + React Testing Library + supertest     | Vitest reaproveita o mesmo motor (Vite/esbuild) do build do frontend React, evitando manter duas ferramentas de bundling/transpilação distintas para app e testes; React Testing Library testa os componentes pela perspectiva do usuário (o que aparece na tela) em vez de detalhes internos; `supertest` exercita as rotas Express reais, incluindo os middlewares de validação Zod, sem precisar abrir uma porta de rede de fato |
| 2026-10-01 | Validação com Zod em schema compartilhado (`packages/shared`)   | O desafio exige explicitamente "as mesmas regras de validação" nos dois caminhos de cadastro; colocar as regras em um único pacote importado tanto pelo formulário React quanto pelo endpoint Express garante isso por construção, em vez de depender de manter duas implementações sincronizadas manualmente |
| 2026-10-01 | Framework backend: Express                                      | A aplicação tem poucas rotas (cadastro manual, cadastro com PDF, listagem, detalhe) e nenhuma necessidade de DI/módulos complexos; Express atende com boilerplate mínimo, o que importa dado o prazo de três dias — um framework mais estruturado como NestJS cobraria um custo de setup não justificado neste escopo |
| 2026-10-01 | Estrutura do repositório: npm workspaces (monorepo)              | O desafio exige um único repositório com frontend e backend; workspaces permite instalar as dependências de `frontend/`, `backend/` e `packages/shared/` com um único `npm install` na raiz e rodar scripts de cada pacote a partir dali, favorecendo o critério de avaliação "facilidade para configurar e executar o projeto" |
| 2026-10-01 | Extração de texto do PDF: `pdf-parse`                            | O requisito é extrair o texto corrido do PDF para depois rodar regex de nome/e-mail/telefone sobre ele; `pdf-parse` expõe exatamente isso (buffer → string), sem a complexidade de lidar com posição/estrutura de página que uma lib como `pdfjs-dist` exporia e que não é necessária aqui |
| 2026-10-01 | ORM/migrations: Prisma                                          | O schema declarativo (`schema.prisma`) funciona como documentação viva do modelo de dados exigido (nome, e-mail, telefone, área de interesse, resumo), e `prisma migrate` gera e versiona os scripts de migration automaticamente, atendendo ao requisito de entregar "scripts ou migrations para criar a estrutura do banco" sem escrever DDL à mão |
| 2026-10-01 | TypeScript em todo o projeto (frontend, backend, shared)         | A especificação não impede TypeScript e é a opção mais sensata: sacrificar tipagem forte, principalmente no backend, é raiz de problemas comuns; TypeScript e JavaScript têm interoperação total, então reverter seria trivial se necessário |
| 2026-10-01 | SQL Server executado via Docker Compose em desenvolvimento       | Aumenta compatibilidade e facilita execução independente do sistema operacional, além de isolar a instância do banco do restante do ambiente |
| 2026-10-01 | Frontend: React                                                 | Mais simples e permite uma estrutura de formulários razoável para o escopo do desafio |
| 2026-10-01 | Backend: Node.js (com TypeScript)                                | Preferência pessoal por linguagens compiladas no backend, mas dado que o frontend também usa TypeScript, manter a mesma linguagem nos dois lados aumenta a coesão do código |

## Notes for DESENVOLVIMENTO.md

- O método de trabalho descrito em [Roles & agent workflow](#roles--agent-workflow)
  (Project Manager e Developer como agentes, Stakeholder/QA humano) deve ser
  chamado de **"agentic loop"** no `DESENVOLVIMENTO.md` final — é o termo que
  Luiz quer usar para descrever esse processo na entrega.
