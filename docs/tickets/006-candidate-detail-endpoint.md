# 006 — Endpoint de detalhe de candidato (`GET /api/candidates/:id`)

**Branch:** `feat/candidate-detail-endpoint`

**Requisitos:** `docs/requirements/cadastro-de-candidatos.md` (requisito
funcional 7).

**Dependências:** 002 (model Prisma), 003 (app Express).

## O que fazer

Em `backend/src/`, criar a rota `GET /api/candidates/:id`:

- `:id` esperado como inteiro (ver ticket 002 — `id: Int autoincrement`).
- `id` não numérico (ex. `/api/candidates/abc`) → `400` com mensagem clara.
- `id` numérico mas sem candidato correspondente → `404` com mensagem
  clara ("Candidato não encontrado.").
- `id` existente → `200` com `{ data: <candidato completo, incluindo
  summary> }`.

## Critérios de aceite

- [ ] Id existente retorna `200` e todos os campos, incluindo `summary`.
- [ ] Id inexistente (mas numérico) retorna `404` com mensagem clara.
- [ ] Id não numérico retorna `400` com mensagem clara (não `500`).

## Testes esperados

`supertest` em `backend/src/candidates.detail.test.ts`: os três casos
acima, criando um candidato via Prisma no `beforeEach` para o caso de
sucesso.
