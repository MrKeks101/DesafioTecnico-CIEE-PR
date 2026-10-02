# 014 — Upload de PDF no formulário de cadastro

**Branch:** `feat/frontend-pdf-upload`

**Requisitos:** `docs/requirements/importacao-pdf.md` (requisitos
funcionais 1, 2, 3, 6, 7). `specs.md` linhas 10, 13, 36, 37, 38.

**Dependências:** 001 (constantes de validação de arquivo), 009
(`CandidateForm`), 013 (endpoint de extração).

## O que fazer

Estender `CandidateForm` (ticket 009) com um campo de upload opcional
("Importar currículo em PDF (opcional)") no topo do formulário:

- Ao selecionar um arquivo, valida no cliente, **antes de qualquer
  chamada de rede**, usando `MAX_PDF_SIZE_BYTES`/`ALLOWED_PDF_MIME_TYPES`
  de `shared`: tipo/tamanho inválido → mensagem clara imediata, input de
  arquivo é limpo, nenhuma chamada à API, formulário continua
  normalmente preenchível manualmente.
- Arquivo válido → mostra estado "Lendo currículo..." e chama `POST
  /api/candidates/extract` (`multipart/form-data`).
- Resposta de sucesso (`200`, `data` com campos) → pré-preenche
  `fullName`/`email`/`phone` no formulário **apenas os campos
  retornados** (campos ausentes na resposta não sobrescrevem o que a
  pessoa já tiver digitado); todos os campos continuam editáveis.
- Resposta com `warning` (falha de leitura) → mostra a mensagem de aviso
  próxima ao campo de upload, sem preencher nada, e **sem desabilitar o
  resto do formulário** — a pessoa preenche manualmente.
- Falha de rede ao chamar `/extract` → mesmo tratamento do caso acima
  (mensagem clara, formulário continua utilizável).
- O salvamento final continua sendo o submit normal do formulário
  (`POST /api/candidates`, ticket 009/004) — o upload só pré-popula
  campos, nunca salva por si.

## Critérios de aceite

- [ ] Selecionar arquivo não-PDF mostra mensagem clara e não chama a API
      de extração.
- [ ] Selecionar PDF acima de 5 MB mostra mensagem clara e não chama a
      API de extração.
- [ ] Selecionar PDF válido chama `POST /api/candidates/extract` e, em
      sucesso, preenche os campos retornados no formulário.
- [ ] Resposta de extração com `warning` mostra a mensagem e não trava o
      formulário — ainda é possível preencher e submeter manualmente.
- [ ] Após pré-preenchimento via PDF, a pessoa pode editar qualquer campo
      antes de submeter, e o submit final usa os valores editados (não os
      originais extraídos).
- [ ] Não selecionar nenhum arquivo não impede o submit manual normal do
      formulário (regressão do ticket 009 continua passando).

## Testes esperados

React Testing Library em `frontend/src/CandidateForm.test.tsx` (estendendo
os testes do ticket 009) ou um novo arquivo dedicado ao upload, com
`fetch` mockado para `/extract`: os seis casos acima. Usar
`userEvent.upload` para simular a seleção de arquivo, com `File` mockados
de tipo/tamanho controlados.
