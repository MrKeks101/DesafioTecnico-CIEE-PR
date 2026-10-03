# 019 — Erro de tipo no parâmetro `:id` de `candidates.ts`

**Branch:** `fix/candidates-id-param-type`

**Requisitos:** `docs/requirements/cadastro-de-candidatos.md` (endpoint de
detalhe). Erro de tipo pré-existente, introduzido pelo ticket 006.

**Dependências:** 006 (já mergeado).

## O que fazer

`npx tsc -p backend/tsconfig.json --noEmit` reporta, em
`backend/src/candidates.ts` (linha ~77), que `req.params.id` está tipado como
`string | string[]` (comportamento do Express 5) e não é atribuível a `string`.

Corrigir o tratamento do parâmetro de forma que o tipo fique correto. Se o
valor vier como array, tratar como id inválido e responder `400`, do mesmo
jeito que o id não-numérico já é tratado hoje. O comportamento de resposta
dos casos já existentes (200, 404, 400) não deve mudar.

Não alterar código fora de `backend/src/candidates.ts` e do arquivo de teste
correspondente.

## Critérios de aceite

- [ ] `npm run build -w backend` roda sem erros de tipo.
- [ ] `GET /api/candidates/:id` mantém 200, 404 e 400 como hoje.
- [ ] Um caso novo cobre o parâmetro chegando como array e responde `400`.

## Testes esperados

Acrescentar o caso do array em `backend/src/candidates.detail.test.ts`,
mantendo os casos atuais.
