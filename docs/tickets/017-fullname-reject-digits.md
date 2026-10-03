# 017 — Nome completo não deve aceitar números

**Branch:** `fix/fullname-reject-digits`

**Requisitos:** `docs/requirements/cadastro-de-candidatos.md`. Achado pelo
stakeholder (QA) ao testar manualmente o fluxo completo depois do ticket 011.

**Dependências:** nenhuma — altera um schema já existente.

## O que fazer

Em `packages/shared/src/candidate.ts`, o campo `fullName` do `candidateSchema`
hoje só valida presença e tamanho — aceita dígitos. Adicionar uma validação
de formato que rejeite números, permitindo apenas o que é razoável num nome
de pessoa: letras (incluindo acentuadas — á, é, í, ó, ú, â, ê, ô, ã, õ, ç
etc.), espaços, hífens e apóstrofos. Mensagem de erro clara (ex: "Nome
completo não pode conter números.").

Como `candidateSchema` é compartilhado entre frontend e backend (decisão em
`PROJECT.md`), a correção vale automaticamente para os dois cadastros
(manual e, mais tarde, PDF) sem precisar tocar em mais nenhum lugar.

## Critérios de aceite

- [ ] "João da Silva" é aceito.
- [ ] "Maria José O'Brien-Santos" é aceito (hífen e apóstrofo).
- [ ] "João 123" é rejeitado com mensagem clara.
- [ ] "123456" é rejeitado.
- [ ] Testes existentes de `candidateSchema` continuam passando.

## Testes esperados

Novos casos em `packages/shared/src/candidate.test.ts` cobrindo os critérios
acima (nome válido com acentos/hífen/apóstrofo, nome com dígitos rejeitado,
nome só numérico rejeitado).
