# 002 — Modelo Candidate e migration (Prisma + SQL Server)

**Branch:** `feat/prisma-candidate-model`

**Requisitos:** `docs/requirements/cadastro-de-candidatos.md` (seção
"Modelo de dados"; requisito funcional 10). `specs.md` linha 34 ("Scripts
ou migrations para criar a estrutura do banco"). `PROJECT.md` → decisão
"ORM/migrations: Prisma".

**Dependências:** 001 (nomes de campo devem casar com o schema Zod).

## O que fazer

Em `prisma/schema.prisma`, substituir o comentário-placeholder por um model
`Candidate`:

- `id`: `Int @id @default(autoincrement())`.
- `fullName`: `String`.
- `email`: `String`.
- `phone`: `String?`.
- `areaOfInterest`: `String?`.
- `summary`: `String? @db.NVarChar(Max)` (texto potencialmente longo —
  evitar truncamento no `nvarchar(1000)` default do provider `sqlserver`).
- `createdAt`: `DateTime @default(now())`.

Gerar a migration com `npx prisma migrate dev --name add_candidate` contra
o SQL Server do `docker-compose.yml` (`npm run db:up` primeiro) e commitar
o conteúdo gerado em `prisma/migrations/`. Rodar `npx prisma generate` para
confirmar que o client gerado compila.

## Critérios de aceite

- [ ] `prisma/schema.prisma` tem o model `Candidate` com os campos acima.
- [ ] `prisma/migrations/<timestamp>_add_candidate/migration.sql` existe e
      está commitado.
- [ ] `npx prisma migrate dev` aplica limpo em um banco novo (container
      `docker-compose.yml` recriado do zero) sem erros.
- [ ] `npx prisma generate` roda sem erros e o `@prisma/client` tipado
      reflete os campos do model.
- [ ] Nenhum dado de credencial real commitado — `DATABASE_URL` usada vem
      do `.env` local (gitignored), não hardcoded.

## Testes esperados

Nenhum teste automatizado dedicado a este ticket (é schema + migration).
Verificação é manual: aplicar a migration contra o container Docker local e
confirmar a tabela via `npx prisma studio` ou um client SQL. A cobertura
funcional do modelo vem do ticket 004 (endpoint de criação), cujos testes
`supertest` batem no banco real através do Prisma Client.
