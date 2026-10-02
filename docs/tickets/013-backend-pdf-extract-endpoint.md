# 013 — Endpoint de extração de PDF (`POST /api/candidates/extract`)

**Branch:** `feat/backend-pdf-extract-endpoint`

**Requisitos:** `docs/requirements/importacao-pdf.md` (requisitos
funcionais 2, 3, 4, 5, 8). `specs.md` linhas 32, 36, 37.

**Dependências:** 001 (constantes `MAX_PDF_SIZE_BYTES`/`ALLOWED_PDF_MIME_TYPES`),
003 (app Express), 012 (módulo de extração).

## O que fazer

Em `backend/src/`, criar a rota `POST /api/candidates/extract`
(`multipart/form-data`, campo de arquivo `file`):

- `multer` configurado em memória (`memoryStorage`), com `limits.fileSize
  = MAX_PDF_SIZE_BYTES` e `fileFilter` checando `ALLOWED_PDF_MIME_TYPES`
  (de `shared`).
- Arquivo ausente: `400` com mensagem clara (esta rota exige arquivo — a
  ausência de arquivo no fluxo geral é tratada no frontend simplesmente
  não chamando esta rota, ver ticket 014).
- Arquivo com tipo errado ou maior que 5 MB: `400` com mensagem clara
  ("Arquivo inválido: envie um PDF de até 5 MB.").
- Arquivo válido: chama `extractTextFromPdf` (ticket 012); se der erro de
  leitura, responde `200` (não `500`) com `{ data: {}, warning: "Não foi
  possível ler o PDF. Preencha os campos manualmente." }` — nunca bloqueia
  o restante do cadastro.
- Leitura OK: chama `extractCandidateFields` sobre o texto e responde
  `200` com `{ data: { fullName?, email?, phone? } }` (campos ausentes
  quando não identificados — sem `warning` neste caso, ou com um aviso
  mais brando se nada foi encontrado, à critério da implementação, desde
  que a mensagem seja clara).
- Esta rota **não** persiste nada no banco.

## Critérios de aceite

- [ ] PDF válido com nome/e-mail/telefone identificáveis → `200`, `data`
      com os três campos.
- [ ] Arquivo maior que 5 MB → `400`, mensagem clara, nada processado.
- [ ] Arquivo que não é PDF (ex. `.txt`, `.png`) → `400`, mensagem clara.
- [ ] Requisição sem arquivo nenhum → `400`, mensagem clara.
- [ ] PDF corrompido/ilegível → `200` (não `500`), `data: {}` (ou
      parcial), `warning` presente.
- [ ] PDF legível mas sem nenhum campo identificável → `200`, `data: {}`,
      sem erro.

## Testes esperados

`supertest` em `backend/src/candidates.extract.test.ts`, usando fixtures
em `backend/src/pdf/__fixtures__/` (ex. `curriculo-valido.pdf` pequeno com
dados fictícios conhecidos, `nao-e-pdf.txt`, e um buffer/arquivo corrompido
gerado inline ou salvo como fixture) para os seis casos acima. Gerar o PDF
de fixture é responsabilidade deste ticket (pode reaproveitar o PDF do
ticket 015, se esse for feito antes — caso contrário, criar um fixture
mínimo próprio e deixar o ticket 015 reusá-lo ou gerar o seu).
