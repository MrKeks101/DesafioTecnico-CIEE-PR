# 012 — Módulo de extração de nome/e-mail/telefone de texto de PDF

**Branch:** `feat/pdf-extraction-module`

**Requisitos:** `docs/requirements/importacao-pdf.md` (requisitos
funcionais 6, 7; seção "Heurística de extração — limitações conhecidas").
`specs.md` linhas 10, 38.

**Dependências:** nenhuma (módulo puro, novo).

## O que fazer

Em `backend/src/pdf/`, criar duas funções puras e desacopladas (seguindo a
regra do `PROJECT.md`/agente Developer de manter extração de PDF
desacoplada dos handlers Express):

1. `extractTextFromPdf(buffer: Buffer): Promise<string>` — encapsula
   `pdf-parse`; propaga/relança um erro tipado (ex. `PdfReadError`) se o
   parse falhar, para o chamador (ticket 013) decidir como responder.
2. `extractCandidateFields(text: string): { fullName?: string; email?:
   string; phone?: string }` — função síncrona, sem I/O, que roda regex
   sobre o texto já extraído:
   - `email`: regex padrão de e-mail; primeira ocorrência válida.
   - `phone`: regex cobrindo formatos comuns de telefone brasileiro (com/
     sem DDI `+55`, com/sem parênteses no DDD, com/sem hífen); primeira
     ocorrência válida.
   - `fullName`: heurística simples e documentada no código (ex. primeira
     linha não vazia do texto que não seja o próprio e-mail/telefone
     encontrado, com um teto de tamanho razoável) — ver limitações em
     `docs/requirements/importacao-pdf.md`.
   - Qualquer campo não encontrado fica `undefined` — nunca lança erro.

Function 2 é a mais importante de testar bem, por ser puro texto→dados,
sem depender de arquivos PDF reais nos testes.

## Critérios de aceite

- [ ] `extractCandidateFields` encontra `email` em texto com um e-mail em
      formato padrão.
- [ ] `extractCandidateFields` encontra `email` correto quando há mais de
      um e-mail no texto (usa o primeiro).
- [ ] `extractCandidateFields` retorna `email: undefined` quando não há
      e-mail no texto — não lança erro.
- [ ] `extractCandidateFields` encontra `phone` em pelo menos três formatos
      diferentes comuns no Brasil (ex. `(41) 99999-9999`, `41999999999`,
      `+55 41 99999-9999`).
- [ ] `extractCandidateFields` retorna `phone: undefined` quando não há
      telefone reconhecível.
- [ ] `extractCandidateFields` retorna algo plausível para `fullName` em
      um texto de currículo simulado "bem comportado" (nome na primeira
      linha).
- [ ] `extractCandidateFields` com texto vazio/`""` retorna os três campos
      `undefined`, sem lançar erro.
- [ ] `extractTextFromPdf` propaga um erro tipado quando o parse falha
      (testável passando um buffer inválido, ex. `Buffer.from("not a pdf")`).

## Testes esperados

Vitest em `backend/src/pdf/extractCandidateFields.test.ts` (função pura,
sem necessidade de PDFs reais — strings de texto simuladas cobrindo os
casos acima) e `backend/src/pdf/extractTextFromPdf.test.ts` (pode usar um
buffer inválido para o caso de erro; um PDF válido pequeno de fixture é
opcional aqui — fica garantido de ponta a ponta no ticket 013 via
`supertest`).
