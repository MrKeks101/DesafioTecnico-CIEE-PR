# 008 — Shell da aplicação e navegação (frontend)

**Branch:** `feat/frontend-app-shell`

**Requisitos:** `docs/requirements/cadastro-de-candidatos.md` (requisito
funcional 8; questão aberta "Navegação do frontend").

**Dependências:** 007 (infra de testes).

## O que fazer

Remover o conteúdo de demonstração do Vite (`App.tsx` atual — contador,
links para docs do Vite/React) e montar um shell mínimo com três "telas"
controladas por estado React (sem biblioteca de rotas — nenhuma nova
dependência, ver decisão em `docs/requirements/cadastro-de-candidatos.md`):

- `"form"` — Novo cadastro (placeholder até o ticket 009).
- `"list"` — Listagem de candidatos (placeholder até o ticket 010).
- `"detail"` — Detalhe de um candidato, recebendo o `id` selecionado
  (placeholder até o ticket 011).

Estrutura sugerida: um componente `App` guardando `view` (`"form" | "list"
| { type: "detail", id: number }`) em `useState`, um cabeçalho/nav simples
com botões "Novo cadastro" / "Candidatos", e um `switch` renderizando o
componente da view atual. Os componentes reais de cada view são criados
nos tickets seguintes — este ticket só entrega a casca e a navegação entre
placeholders.

Pode (e deve) remover os assets não usados do scaffold Vite
(`react.svg`, `vite.svg`, `hero.png`, `App.css` de exemplo) ou mantê-los
só se reaproveitados no layout novo.

## Critérios de aceite

- [ ] `App.tsx` não contém mais o contador/links de demonstração do Vite.
- [ ] Navegação por botões/links entre "Novo cadastro" e "Candidatos"
      funciona (troca o conteúdo renderizado).
- [ ] Existe um mecanismo (prop/callback) para a view de listagem navegar
      para a view de detalhe passando um `id`.
- [ ] `npm run dev -w frontend` sobe sem erros e mostra o shell novo.

## Testes esperados

React Testing Library em `frontend/src/App.test.tsx`: renderiza `App`,
confirma que o nav mostra os itens esperados, clica em "Candidatos" e
confirma que o placeholder/conteúdo da view de listagem aparece (e
vice-versa para "Novo cadastro").
