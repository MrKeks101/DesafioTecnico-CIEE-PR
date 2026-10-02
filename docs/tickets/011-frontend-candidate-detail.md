# 011 — Tela de detalhe de candidato

**Branch:** `feat/frontend-candidate-detail`

**Requisitos:** `docs/requirements/cadastro-de-candidatos.md` (requisitos
funcionais 7, 8, 9). `specs.md` linha 11.

**Dependências:** 006 (endpoint de detalhe), 010 (origem da navegação com
`id`), 008 (shell/view "detail").

## O que fazer

Criar `CandidateDetail`, recebendo o `id` do candidato (via props/estado do
shell): ao montar, chama `GET /api/candidates/:id`, e renderiza:

- Estado de carregamento.
- Todos os campos do candidato, incluindo `summary` (que não aparece na
  listagem).
- Estado `404` com mensagem clara ("Candidato não encontrado.").
- Estado de erro genérico (falha de rede) com mensagem clara.
- Ação "Voltar para a listagem" que usa o callback de navegação do shell
  (ticket 008) para retornar à view `"list"`.

## Critérios de aceite

- [ ] Mostra estado de carregamento antes da resposta.
- [ ] Renderiza todos os campos (incluindo `summary`) em caso de sucesso.
- [ ] Mostra mensagem clara de "não encontrado" em resposta `404`.
- [ ] Mostra mensagem de erro genérica em falha de rede.
- [ ] Botão "Voltar" navega de volta para a listagem.

## Testes esperados

React Testing Library em `frontend/src/CandidateDetail.test.tsx`, com
`fetch` mockado: os quatro casos de estado acima + a navegação de volta.

## Marco

Com este ticket fechado, o caminho **manual** (cadastrar → listar →
detalhar) está demonstrável de ponta a ponta: frontend React ↔ backend
Express ↔ SQL Server via Prisma. Os tickets seguintes (012-014) adicionam
o caminho de importação por PDF sobre a mesma base.
