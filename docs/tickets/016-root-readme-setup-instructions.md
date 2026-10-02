# 016 — README.md raiz: setup, execução e testes

**Branch:** `docs/readme-setup-instructions`

**Requisitos:** `specs.md` linha 67 ("README.md com os requisitos e
comandos para configurar a conexão com o SQL Server, criar a estrutura do
banco, executar a aplicação e rodar os testes"), linha 68 ("Exemplos de
configuração sem credenciais reais"), linha 27 ("Informe no README as
tecnologias e versões utilizadas").

**Dependências:** 002 (migrations existem), 004-006 (comandos de backend
funcionam), 009-011 (comandos de frontend funcionam), idealmente feito por
último, depois que todos os comandos documentados já existirem e puderem
ser verificados.

## O que fazer

Escrever/atualizar `README.md` na raiz com:

- Tecnologias e versões usadas (frontend, backend, banco, bibliotecas
  principais) — tirar as versões reais de `package.json` de cada
  workspace, não de memória.
- Pré-requisitos (Node, Docker).
- Passo a passo: copiar `.env.example` → `.env`, `npm install` na raiz,
  `npm run db:up` (sobe o SQL Server), `npx prisma migrate deploy` (ou
  `migrate dev`, explicar a diferença brevemente) para criar a estrutura
  do banco, `npm run dev:backend` / `npm run dev:frontend` para executar.
- Como rodar os testes (`npm run test` na raiz, e os comandos por
  workspace).
- Nota explícita de que os valores em `.env.example` são exemplos, sem
  credenciais reais, e que o `.env` real nunca é commitado.
- Link/menção ao `samples/curriculo-ficticio.pdf` (ticket 015) como
  arquivo de teste de importação.

Este ticket **não** cobre o `DESENVOLVIMENTO.md` — esse arquivo é o
relato pessoal de Luiz sobre o processo e o uso de IA (specs.md linhas
40-52) e fica fora do escopo do agente Developer.

## Critérios de aceite

- [ ] Alguém sem contexto prévio consegue, só seguindo o README, levantar
      o banco, aplicar a migration, rodar backend+frontend e rodar os
      testes.
- [ ] Nenhuma credencial real aparece no README (só os valores de exemplo
      do `.env.example`).
- [ ] Versões de tecnologias citadas conferem com os `package.json` reais
      no momento do ticket.

## Testes esperados

Nenhum teste automatizado (é documentação). Verificação é a execução
manual do passo a passo do zero (idealmente em uma clonagem limpa do
repositório) por quem fechar o ticket.
