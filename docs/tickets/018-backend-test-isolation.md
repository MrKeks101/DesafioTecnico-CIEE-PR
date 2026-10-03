# 018 — Testes do backend independentes do estado do banco

**Branch:** `fix/backend-test-isolation`

**Requisitos:** não há requisito funcional novo — é infraestrutura de teste.
Motivação: o teste "returns 200 with an empty list" de
`backend/src/candidates.list.test.ts` assume que a tabela `Candidate` está
vazia. O banco de dev é compartilhado com os testes manuais do stakeholder, então
registros sobrando fazem o teste falhar de forma intermitente. Já apontado
pelos tickets 005 e 017.

**Dependências:** nenhuma.

## O que fazer

- Em `backend/src/candidates.list.test.ts`, adicionar um `beforeEach` que
  apaga todos os registros da tabela (`prisma.candidate.deleteMany()`), para
  que cada teste comece com estado conhecido.
- Revisar `backend/src/candidates.create.test.ts` e
  `backend/src/candidates.detail.test.ts`: se algum depender de contagem total
  ou de ausência de registros, aplicar a mesma limpeza. Se não depender,
  não mexer.
- Manter `fileParallelism: false` em `backend/vitest.config.ts` (os arquivos
  de teste continuam compartilhando o mesmo banco, então precisam rodar em
  sequência).
- Não alterar nenhum código de produção.

**Consequência conhecida, a documentar no README (ticket 016):** a suíte do
backend apaga a tabela `Candidate` do banco de desenvolvimento a cada execução.
Não rodar os testes com dados manuais que se queira preservar.

## Critérios de aceite

- [ ] Com registros sobrando no banco antes da execução, `npm run test -w backend`
      passa (inclusive o teste de lista vazia).
- [ ] Suíte completa do backend verde em duas execuções seguidas.
- [ ] Nenhuma alteração em arquivos fora de `backend/src/*.test.ts` e
      `backend/vitest.config.ts`.

## Testes esperados

Os próprios arquivos de teste citados acima. Nenhum teste novo é necessário.
