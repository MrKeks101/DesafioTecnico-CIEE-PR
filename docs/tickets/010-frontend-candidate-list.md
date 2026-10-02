# 010 — Tela de listagem de candidatos

**Branch:** `feat/frontend-candidate-list`

**Requisitos:** `docs/requirements/cadastro-de-candidatos.md` (requisitos
funcionais 8, 9). `specs.md` linha 11.

**Dependências:** 005 (endpoint de listagem), 008 (shell/view "list").

## O que fazer

Criar `CandidateList`: ao montar, chama `GET /api/candidates`, e renderiza:

- Estado de carregamento ("Carregando candidatos...").
- Estado vazio ("Nenhum candidato cadastrado ainda.") quando `data` é `[]`.
- Estado de erro claro quando a requisição falha (rede ou status não-2xx).
- Lista/tabela com `fullName`, `email`, `phone`, `areaOfInterest` por
  candidato quando há dados, cada linha com uma ação (botão/link) "Ver
  detalhes" que chama o callback de navegação (recebido do shell, ticket
  008) passando o `id` do candidato.

## Critérios de aceite

- [ ] Mostra estado de carregamento antes da resposta.
- [ ] Mostra estado vazio quando a API retorna `data: []`.
- [ ] Mostra estado de erro claro quando o `fetch` falha ou retorna status
      de erro.
- [ ] Renderiza uma linha por candidato com os campos esperados quando a
      API retorna dados.
- [ ] Clicar em "Ver detalhes" de uma linha dispara a navegação para a
      view de detalhe com o `id` correto.

## Testes esperados

React Testing Library em `frontend/src/CandidateList.test.tsx`, com
`fetch` mockado: os cinco casos acima (usar dados fixos de exemplo para o
caso "com dados").
