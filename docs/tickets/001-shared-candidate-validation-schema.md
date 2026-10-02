# 001 — Schema de validação compartilhado do candidato

**Branch:** `feat/shared-candidate-schema`

**Requisitos:** `docs/requirements/cadastro-de-candidatos.md` (seções
"Modelo de dados" e "Requisitos funcionais" 1-4), `docs/requirements/importacao-pdf.md`
(requisito 2 — constantes de limite de arquivo). `PROJECT.md` → decisão
"Validação com Zod em schema compartilhado (`packages/shared`)".

**Dependências:** nenhuma.

## O que fazer

Em `packages/shared/src/`, substituir o placeholder por:

- `candidateSchema` (Zod): `fullName` (string obrigatória, `trim`, não
  vazia), `email` (string obrigatória, formato e-mail), `phone`,
  `areaOfInterest`, `summary` (todos opcionais, string, com `trim`;
  default razoável tipo `.max(...)` para evitar payloads absurdos — definir
  limites de tamanho sensatos, ex. `fullName` até 200, `email` até 255,
  `phone` até 30, `areaOfInterest` até 150, `summary` até 5000).
- Tipo TS inferido (`CandidateInput = z.infer<typeof candidateSchema>`).
- Constantes de validação de arquivo PDF: `MAX_PDF_SIZE_BYTES` (5 * 1024 *
  1024) e `ALLOWED_PDF_MIME_TYPES` (`['application/pdf']`), exportadas do
  mesmo pacote para reuso em `backend` (multer) e `frontend` (checagem antes
  do upload).
- Exportar tudo de `packages/shared/src/index.ts`.

Não validar formato de telefone com regex (ver questão aberta em
`cadastro-de-candidatos.md`) — só tipo string + limite de tamanho.

## Critérios de aceite

- [ ] `candidateSchema` rejeita payload sem `fullName` ou com `fullName`
      vazio/só espaços, com mensagem de erro clara.
- [ ] `candidateSchema` rejeita payload sem `email` e payload com `email`
      em formato inválido, com mensagem de erro clara.
- [ ] `candidateSchema` aceita payload só com `fullName` e `email`
      (demais campos ausentes/undefined).
- [ ] `candidateSchema` aceita payload completo com todos os campos.
- [ ] `candidateSchema` rejeita campos opcionais acima do limite de
      tamanho definido.
- [ ] `MAX_PDF_SIZE_BYTES` e `ALLOWED_PDF_MIME_TYPES` exportados e
      cobertos por pelo menos um teste de uso (ex.: `5 * 1024 * 1024 ===
      MAX_PDF_SIZE_BYTES`).
- [ ] `npm run test -w packages/shared` passa.

## Testes esperados

Vitest, em `packages/shared/src/*.test.ts`: casos válidos e inválidos do
`candidateSchema` listados acima (um `it` por caso), cobrindo trimming de
espaços e limites de tamanho.
