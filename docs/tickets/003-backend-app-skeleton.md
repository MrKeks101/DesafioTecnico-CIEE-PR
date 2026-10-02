# 003 — Esqueleto da aplicação Express

**Branch:** `feat/backend-app-skeleton`

**Requisitos:** `docs/requirements/cadastro-de-candidatos.md` (requisito 5,
implicitamente — precisa de uma app Express real antes de qualquer rota).
`PROJECT.md` → decisão "Framework backend: Express".

**Dependências:** nenhuma (pode ser feito em paralelo com 001/002).

## O que fazer

Substituir o placeholder de `backend/src/index.ts` por uma aplicação Express
real, organizada para ser testável com `supertest` sem abrir uma porta:

- `backend/src/app.ts`: cria e exporta a instância do Express
  (`cors()`, `express.json()` com limite de tamanho razoável, ex. `1mb` —
  uploads de PDF usam `multer`, não o parser JSON), um `GET /api/health`
  retornando `{ status: "ok" }`, um handler 404 para rotas desconhecidas
  retornando JSON (`{ error: { message: "Rota não encontrada" } }`), e um
  middleware de erro central no final que captura exceções e responde com
  JSON consistente (`{ error: { message } }`) — nunca um stack trace para o
  cliente.
- `backend/src/index.ts`: importa `app` de `./app`, chama `app.listen(PORT)`
  usando `process.env.PORT` (fallback `3001`, já presente no `.env.example`).

## Critérios de aceite

- [ ] `GET /api/health` responde `200` com `{ status: "ok" }`.
- [ ] Rota inexistente responde `404` com corpo JSON `{ error: { message }
      }`.
- [ ] Um erro lançado dentro de uma rota (simulado no teste) é capturado
      pelo middleware de erro e responde `500` com JSON `{ error: { message
      } }` genérico, sem stack trace no corpo.
- [ ] `npm run dev -w backend` sobe a aplicação e `GET /api/health`
      responde via HTTP real (verificação manual, não automatizada).
- [ ] `npm run test -w backend` passa.

## Testes esperados

`supertest` em `backend/src/app.test.ts`, importando `app` diretamente (sem
`listen`): os três casos acima (`/api/health`, rota 404, rota que lança
erro — pode ser uma rota de teste temporária montada só no teste, ou uma
rota real de diagnóstico removida depois).
