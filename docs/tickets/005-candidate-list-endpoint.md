# 005 — Endpoint de listagem de candidatos (`GET /api/candidates`)

**Branch:** `feat/candidate-list-endpoint`

**Requisitos:** `docs/requirements/cadastro-de-candidatos.md` (requisito
funcional 6).

**Dependências:** 002 (model Prisma), 003 (app Express).

## O que fazer

Em `backend/src/`, criar a rota `GET /api/candidates`:

- Busca todos os candidatos via Prisma, ordenados por `createdAt` desc.
- Responde `200` com `{ data: [...] }` — lista completa, sem paginação
  (ver questão aberta no requisitos doc).
- Lista vazia → `200` com `{ data: [] }` (não é erro).

## Critérios de aceite

- [ ] Banco vazio → `200`, `data: []`.
- [ ] Com candidatos cadastrados → `200`, `data` contém todos, ordenados
      do mais recente para o mais antigo.
- [ ] Cada item da lista inclui `id`, `fullName`, `email`, `phone`,
      `areaOfInterest`, `createdAt` (pode incluir `summary` também — não é
      exigido omitir).

## Testes esperados

`supertest` em `backend/src/candidates.list.test.ts`: popular o banco de
teste direto via Prisma (`prisma.candidate.create`) no `beforeEach`, limpar
no `afterEach`, cobrir lista vazia e lista com múltiplos itens (checar
ordenação).
