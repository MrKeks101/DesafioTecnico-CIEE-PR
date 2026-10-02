# 009 — Formulário de cadastro de candidato (manual)

**Branch:** `feat/frontend-candidate-form`

**Requisitos:** `docs/requirements/cadastro-de-candidatos.md` (requisitos
funcionais 1, 5, 9). `specs.md` linhas 9, 11, 35, 37.

**Dependências:** 001 (schema Zod compartilhado), 004 (endpoint de
criação), 008 (shell/view "form").

## O que fazer

Criar `CandidateForm` (componente controlado) com campos: `fullName*`,
`email*`, `phone`, `areaOfInterest`, `summary` (textarea) — rótulos em
português, usando `*` ou texto para indicar obrigatório.

- Validação client-side usa `candidateSchema` de `shared`
  (`.safeParse`) no submit; mostra mensagem de erro clara por campo quando
  inválido, sem chamar a rede.
- Submit válido → `fetch('/api/candidates', { method: 'POST', ... })`
  (ou a URL base configurada — ver nota abaixo); em sucesso (`201`), mostra
  mensagem "Cadastro salvo com sucesso." e limpa o formulário (ou navega
  para a listagem, via callback recebido do shell do ticket 008).
- Resposta de erro do servidor (`400`, corpo `{ error: { fields } }`) é
  mapeada de volta para os campos correspondentes.
- Falha de rede (servidor fora, etc.) mostra mensagem de erro genérica
  clara, sem travar o formulário.
- Este componente deve expor uma forma de **pré-preencher** os campos a
  partir de props/estado externo — é o gancho que o ticket 014 (upload de
  PDF) vai usar para popular os campos extraídos. Não implementar o upload
  aqui, só deixar o componente capaz de receber valores iniciais/externos.
- Base URL da API: usar uma variável de ambiente Vite (`import.meta.env.VITE_API_URL`,
  com fallback para `http://localhost:3001` em dev) em vez de hardcode —
  documentar no `.env.example` do frontend se criar um.

## Critérios de aceite

- [ ] Submeter com `fullName`/`email` vazios mostra erro nos dois campos,
      sem chamar `fetch`.
- [ ] Submeter com `email` em formato inválido mostra erro no campo,
      sem chamar `fetch`.
- [ ] Submeter só com `fullName`+`email` válidos chama `fetch` com o
      payload esperado e, em sucesso, mostra a mensagem de confirmação.
- [ ] Resposta mockada de erro do servidor (`400` com `fields.email`)
      exibe a mensagem no campo `email`.
- [ ] Resposta mockada de falha de rede exibe mensagem de erro genérica.
- [ ] Componente aceita valores iniciais externos para os campos
      `fullName`/`email`/`phone` (mesmo que, neste ticket, nada ainda os
      forneça de fato).

## Testes esperados

React Testing Library em `frontend/src/CandidateForm.test.tsx`, com
`fetch` mockado (`vi.fn()`/`vi.stubGlobal('fetch', ...)`): os seis casos
acima.
