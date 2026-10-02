# 004 — Endpoint de criação de candidato (`POST /api/candidates`)

**Branch:** `feat/candidate-create-endpoint`

**Requisitos:** `docs/requirements/cadastro-de-candidatos.md` (requisito
funcional 5). `specs.md` linhas 33, 35, 37.

**Dependências:** 001 (schema Zod), 002 (model Prisma), 003 (app Express).

## O que fazer

Em `backend/src/`, criar a rota `POST /api/candidates`:

- Valida `req.body` com `candidateSchema` (de `shared`).
- Em caso de falha de validação: `400` com corpo `{ error: { message,
  fields: { <campo>: <mensagem> } } }` — mensagem clara por campo,
  reaproveitando os `issues` do Zod.
- Em caso de sucesso: persiste via Prisma (`prisma.candidate.create`),
  responde `201` com `{ data: <candidato criado>, message: "Cadastro
  salvo com sucesso." }` (specs.md linha 37 — mensagem clara de sucesso).
- Esta é a **única** rota de persistência — tanto o cadastro manual quanto
  o cadastro assistido por PDF (ticket 014) chamam esta mesma rota depois
  de montar o payload.
- Manter a lógica de acesso ao Prisma em um módulo separado (ex.
  `backend/src/db/client.ts` exportando uma instância única de
  `PrismaClient`) para reuso nos tickets 005/006.

## Critérios de aceite

- [ ] Payload válido (`fullName` + `email` apenas) → `201`, candidato
      persistido, `id` e `createdAt` presentes na resposta.
- [ ] Payload válido completo (todos os campos) → `201`, todos os campos
      persistidos corretamente.
- [ ] Payload sem `fullName` → `400`, mensagem indicando o campo.
- [ ] Payload sem `email` → `400`, mensagem indicando o campo.
- [ ] Payload com `email` em formato inválido → `400`, mensagem indicando
      o campo.
- [ ] Payload com campo opcional acima do limite de tamanho (ticket 001) →
      `400`.
- [ ] Nenhuma falha de validação derruba o processo (sem erro 500 para
      entrada inválida).

## Testes esperados

`supertest` em `backend/src/candidates.create.test.ts`, batendo na rota
real contra o banco de teste (SQL Server do `docker-compose.yml`) — limpar
as linhas criadas no `afterEach`/`afterAll` para não acumular lixo entre
execuções. Cobrir todos os casos da lista de critérios de aceite.
