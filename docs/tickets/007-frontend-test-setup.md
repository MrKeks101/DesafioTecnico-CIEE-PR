# 007 — Infra de testes do frontend (Vitest + React Testing Library)

**Branch:** `chore/frontend-test-setup`

**Requisitos:** `PROJECT.md` → decisão "Stack de testes: Vitest + React
Testing Library + supertest". Necessário para destravar os tickets
008-011/013/014, que exigem testes RTL.

**Dependências:** nenhuma.

## O que fazer

O scaffold do frontend tem `vitest`, `@testing-library/react`,
`@testing-library/jest-dom` e `jsdom` instalados, mas nenhum script de
teste nem configuração. Adicionar:

- `frontend/vite.config.ts` (ou um `vitest.config.ts` separado): `test.environment
  = "jsdom"`, `test.setupFiles` apontando para um arquivo de setup.
- `frontend/src/setupTests.ts` (ou similar): `import
  '@testing-library/jest-dom'`.
- Script `"test": "vitest run"` em `frontend/package.json`.
- Um teste trivial de fumaça (ex. renderiza `<div>ok</div>` e verifica que
  aparece na tela) só para provar que o pipeline funciona — será
  substituído/complementado pelos testes reais dos tickets seguintes.

## Critérios de aceite

- [ ] `npm run test -w frontend` executa e passa.
- [ ] `npm run test` (raiz) executa `shared`, `backend` e `frontend` em
      sequência sem falhar por falta de script no frontend.
- [ ] Matchers de `@testing-library/jest-dom` (`toBeInTheDocument()` etc.)
      funcionam em um teste de exemplo.

## Testes esperados

Um teste de fumaça único, descartável conceitualmente (pode ser substituído
por um teste real de algum componente no ticket 008, se preferir não deixar
um teste "fake" morto no repo).
