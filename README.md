# DesafioTecnico-CIEE-PR

Desafio técnico da CIEE/PR para a vaga de Desenvolvedor de Sistemas: uma
aplicação de **cadastro de currículos**.

A aplicação oferece dois caminhos de cadastro que convergem no mesmo
formulário e nas mesmas regras de validação:

- **Cadastro manual:** a pessoa preenche o formulário e salva.
- **Cadastro com PDF:** o backend extrai nome, e-mail e telefone do currículo
  e preenche o formulário, que pode ser corrigido antes de salvar.

Depois de salvo, o candidato aparece em uma listagem e tem uma tela de
detalhes. O PDF é sempre opcional: se não houver arquivo ou a leitura falhar,
o cadastro manual continua funcionando.

A especificação completa do desafio está em [`specs.md`](specs.md).

## Índice

- [Tecnologias e versões](#tecnologias-e-versões)
- [Pré-requisitos](#pré-requisitos)
- [Configuração passo a passo](#configuração-passo-a-passo)
- [Executando a aplicação](#executando-a-aplicação)
- [Testando a importação de PDF](#testando-a-importação-de-pdf)
- [Rodando os testes](#rodando-os-testes)
- [Outros scripts](#outros-scripts)
- [Problemas conhecidos e limitações](#problemas-conhecidos-e-limitações)
- [Estrutura do repositório](#estrutura-do-repositório)

## Tecnologias e versões

As versões abaixo são as declaradas nos `package.json` de cada workspace. Onde
está indicado `^`, o `package-lock.json` fixa a versão efetivamente instalada.

| Área | Tecnologia | Versão declarada |
|------|------------|------------------|
| Runtime | Node.js | sem `engines` declarado; desenvolvido com v22.19.0 |
| Gerenciador | npm (workspaces) | desenvolvido com 11.6.0 |
| Linguagem | TypeScript (frontend) | `~6.0.2` |
| Linguagem | TypeScript (backend, shared) | `^6.0.3` |
| Frontend | React / react-dom | `^19.2.8` |
| Frontend | Vite | `^8.3.0` |
| Frontend | @vitejs/plugin-react | `^6.1.1` |
| Frontend | Zod | `^4.6.5` |
| Frontend | Vitest | `^5.0.3` |
| Frontend | @testing-library/react | `^16.3.3` |
| Frontend | @testing-library/user-event | `^14.6.7` |
| Frontend | @testing-library/jest-dom | `^7.0.1` |
| Frontend | jsdom | `^29.1.1` |
| Frontend | oxlint (lint) | `^1.81.0` |
| Backend | Express | `^5.2.1` |
| Backend | cors | `^2.8.6` |
| Backend | multer (upload) | `^2.4.0` |
| Backend | pdf-parse (extração de texto do PDF) | `^2.4.5` |
| Backend | Zod | `^4.6.5` |
| Backend | Prisma (CLI) | `6.12.0` (versão exata) |
| Backend | @prisma/client | `6.12.0` (versão exata) |
| Backend | tsx (execução em dev) | `^4.23.15` |
| Backend | Vitest | `^5.0.3` |
| Backend | supertest | `^7.3.0` |
| Compartilhado | `packages/shared` (Zod) | `^4.6.5` |
| Banco | SQL Server 2022 | imagem `mcr.microsoft.com/mssql/server:2022-latest` (`docker-compose.yml`) |

O Prisma está fixado em `6.12.0` de propósito: versões mais novas puxam
dependências de deploy em nuvem que não usamos (ver a tabela de decisões no
`PROJECT.md`).

## Pré-requisitos

- **Node.js** (versão LTS recente; o projeto foi desenvolvido com v22.19.0) e
  **npm**.
- **Docker** com o plugin `docker compose` (Docker Desktop no Windows/macOS).
  Usado para subir o SQL Server local.
- **Git**, para clonar o repositório.
- As portas **1433** (SQL Server), **3001** (API) e **5173** (frontend, Vite)
  livres na máquina.

## Configuração passo a passo

Os comandos abaixo são para executar **na raiz do repositório**.

### 1. Clonar o repositório

```bash
git clone https://github.com/MrKeks101/DesafioTecnico-CIEE-PR.git
cd DesafioTecnico-CIEE-PR
```

### 2. Criar o arquivo `.env`

O projeto traz um `.env.example` com valores de exemplo. Copie-o para `.env`:

```bash
cp .env.example .env
```

No PowerShell (Windows), use:

```powershell
Copy-Item .env.example .env
```

Conteúdo de `.env.example` (valores de exemplo, **sem credenciais reais**):

```dotenv
MSSQL_SA_PASSWORD=Your_strong_password123
DATABASE_URL="sqlserver://localhost:1433;database=desafio_ciee;user=sa;password=Your_strong_password123;trustServerCertificate=true"
PORT=3001
```

- `MSSQL_SA_PASSWORD`: senha do usuário `sa` do SQL Server no container.
  Precisa atender à política de senhas do SQL Server (mínimo de 8 caracteres,
  com maiúsculas, minúsculas, números e símbolos).
- `DATABASE_URL`: string de conexão usada pelo Prisma. A senha deve ser a
  mesma de `MSSQL_SA_PASSWORD`. Se você trocar a senha, troque nos dois
  lugares.
- `PORT`: porta em que a API backend escuta (padrão `3001`).

O `.env` real **nunca é commitado**: ele está no `.gitignore`. Cada pessoa
deve manter o seu, com a própria senha local.

### 3. Instalar as dependências

Na raiz, um único comando instala os três workspaces (`frontend/`,
`backend/` e `packages/shared/`):

```bash
npm install
```

Se o Prisma Client não for gerado automaticamente ao final da instalação, rode
`npx prisma generate`. Veja também o item sobre o
[bug do npm no Windows](#npm-no-windows-npmcli4828).

### 4. Subir o SQL Server

```bash
npm run db:up
```

Isso executa `docker compose up -d` e sobe o container `ciee-desafio-sqlserver`
(imagem `mcr.microsoft.com/mssql/server:2022-latest`, porta `1433`). Na primeira
vez o Docker baixa a imagem, o que pode demorar. Para conferir se o banco
terminou de iniciar:

```bash
docker compose ps
```

Aguarde o status `healthy`. Para parar o banco depois: `npm run db:down`.

### 5. Criar a estrutura do banco (migrations)

```bash
npx prisma migrate deploy
```

Esse comando aplica as migrations que já estão em `prisma/migrations/` no banco
apontado por `DATABASE_URL`. Hoje há uma migration (`add_candidate`), que cria a
tabela `Candidate`.

Diferença entre os dois comandos do Prisma:

- `prisma migrate deploy` **só aplica** migrations já existentes. Não gera
  arquivos novos e não apaga dados. É o comando para configurar um banco do
  zero, como neste passo a passo.
- `prisma migrate dev` **compara o `schema.prisma` com o banco**, gera uma nova
  migration se o modelo mudou e a aplica. É usado durante o desenvolvimento
  quando alteramos o modelo. Pode pedir para resetar o banco se houver
  conflito, então não é o comando indicado para configurar o ambiente.

Se o comando falhar com erro de login, confira se a senha em `DATABASE_URL` é a
mesma de `MSSQL_SA_PASSWORD` e se o container está `healthy`.

## Executando a aplicação

A aplicação tem dois processos: a API e o frontend. Rode cada um em um
terminal separado, a partir da raiz do repositório.

**Terminal 1: backend (API Express)**

```bash
npm run dev:backend
```

A API sobe em `http://localhost:3001`. Para conferir: abra
`http://localhost:3001/api/health`, que deve responder `{"status":"ok"}`.

**Terminal 2: frontend (React + Vite)**

```bash
npm run dev:frontend
```

Abra `http://localhost:5173` no navegador. O frontend chama a API em
`http://localhost:3001` por padrão. Se você mudar `PORT` no `.env`, crie
`frontend/.env.local` com `VITE_API_URL=http://localhost:<nova-porta>` (esse
arquivo é ignorado pelo git).

Com as duas coisas rodando, é possível cadastrar candidatos, ver a listagem e
abrir os detalhes.

## Testando a importação de PDF

O repositório traz um currículo fictício em
[`samples/curriculo-ficticio.pdf`](samples/curriculo-ficticio.pdf) para testar o
cadastro com PDF. Na tela de cadastro, envie esse arquivo: o backend extrai
nome, e-mail e telefone e preenche o formulário. Você pode corrigir os campos
antes de salvar.

## Rodando os testes

Pré-requisito: o SQL Server precisa estar no ar e a migration aplicada (passos
4 e 5). Os testes do backend rodam contra o banco real, e não contra um banco
de teste separado.

Na raiz, roda a suíte dos três workspaces em sequência (`packages/shared`,
`backend` e `frontend`):

```bash
npm run test
```

Também é possível rodar cada workspace separadamente:

```bash
npm run test -w packages/shared   # schemas Zod compartilhados
npm run test -w backend           # API, extração de PDF e Prisma (precisa do SQL Server)
npm run test -w frontend          # componentes React com Testing Library
```

> **Atenção:** a suíte do backend **apaga a tabela `Candidate`** do banco
> configurado em `DATABASE_URL` a cada execução. Como é o mesmo banco de
> desenvolvimento, os candidatos cadastrados manualmente serão perdidos. Veja
> [Problemas conhecidos](#a-suíte-do-backend-apaga-a-tabela-candidate).

## Outros scripts

| Comando | O que faz |
|---------|-----------|
| `npm run build` | Compila `packages/shared`, `backend` e `frontend` (na raiz) |
| `npm run db:up` | Sobe o SQL Server via `docker compose up -d` |
| `npm run db:down` | Derruba o container via `docker compose down` |
| `npm run dev:backend` | API em modo de desenvolvimento (`tsx watch`) |
| `npm run dev:frontend` | Frontend com Vite |
| `npm run lint -w frontend` | Lint do frontend com oxlint |

## Problemas conhecidos e limitações

### npm no Windows (npm/cli#4828)

Em Windows, o npm pode, de forma **intermitente**, não instalar os binários
nativos específicos de plataforma (por exemplo `@esbuild/win32-x64` e
`@rolldown/binding-win32-x64-msvc`, usados por Vite, Vitest e tsx), mesmo
estando listados no `package-lock.json`. Sintomas típicos: erros ao rodar
`npm run dev:frontend` ou `npm run test` dizendo que um módulo nativo não foi
encontrado. É o bug conhecido [npm/cli#4828](https://github.com/npm/cli/issues/4828).

Não encontramos uma correção definitiva. Regenerar o `package-lock.json` do zero
ajudou em uma primeira tentativa, mas o problema voltou depois. O workaround que
funcionou todas as vezes em que foi usado é uma reinstalação limpa:

```bash
# PowerShell (Windows)
Remove-Item -Recurse -Force node_modules, package-lock.json
npm cache clean --force
npm install
npx prisma generate
```

```bash
# Git Bash / Linux / macOS
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npx prisma generate
```

O `npx prisma generate` é necessário depois de qualquer reinstalação limpa, para
regenerar o Prisma Client. Essa reinstalação também recria o `package-lock.json`
localmente, então ele pode aparecer como alterado no `git status`.

Não testamos em Linux nem em macOS. O problema foi observado no Windows.

### A suíte do backend apaga a tabela `Candidate`

Os testes de endpoint do backend (`create`, `list` e `detail`) usam o SQL
Server real configurado em `DATABASE_URL` e limpam a tabela `Candidate` antes
de rodar. Não há um banco de teste separado. Execute a suíte do backend apenas
quando não precisar dos dados do banco de desenvolvimento. Se quiser preservá-los,
faça um backup antes, ou aponte `DATABASE_URL` para um banco separado só para
testes (com a migration aplicada nele também).

### Extração de PDF é heurística

A extração de nome, e-mail e telefone é baseada em regras simples sobre o texto
do PDF, não em análise semântica. Não funciona para qualquer currículo, e por
isso o formulário sempre permite preencher ou corrigir os campos à mão. Os
casos conhecidos em que a extração falha ou fica incompleta:

- **PDF sem texto selecionável** (um escaneado, ou um currículo com o nome dentro
  de imagem): o `pdf-parse` não consegue extrair o texto, então nada é
  identificado. Não há OCR.
- **Layouts de várias colunas** ou cabeçalhos gráficos: a ordem do texto
  extraído pode não corresponder à leitura visual, e o nome pode não ser
  identificado.
- **Nome:** é tirado apenas da **primeira linha não vazia** do texto, e precisa
  parecer um nome (letras, espaços, hífens e apóstrofos, pelo menos duas
  palavras, até o limite de tamanho do campo). Se o nome não estiver na primeira
  linha, o campo fica vazio.
- **E-mail:** é usado o **primeiro** e-mail encontrado no texto. Se o currículo
  tiver mais de um, pode não ser o de contato principal.
- **Telefone:** cobre os formatos brasileiros comuns (com ou sem DDI `+55`, DDD
  com ou sem parênteses, com ou sem separadores). Formatos fora desse padrão
  podem não ser reconhecidos.
- **Tipo do arquivo:** o backend e o frontend aceitam o arquivo pelo tipo MIME
  informado pelo cliente (`application/pdf`) e pelo tamanho (até 5 MB). **Não
  verificamos a assinatura `%PDF-` do arquivo.** Um arquivo que não é PDF, mas
  foi enviado com esse tipo, passa dessa checagem e falha na leitura, caso em
  que a API responde com um aviso e o cadastro manual continua disponível.

Se o PDF não puder ser lido, ou se nenhum campo for identificado, a API responde
`200` com um aviso e os campos vazios. Já arquivo ausente, tipo errado ou acima
de 5 MB recebem `400` com mensagem. Em nenhum desses casos o cadastro manual é
bloqueado.

## Estrutura do repositório

```
/                    raiz do repositório (README, PROJECT, specs, docker-compose)
frontend/            app React (src/ e tests/)
backend/             API Express (src/ e tests/, com fixtures de PDF)
packages/shared/     schemas Zod compartilhados entre frontend e backend
prisma/              schema.prisma e migrations do SQL Server
docs/                requisitos (docs/requirements/) e tickets (docs/tickets/)
samples/             currículo fictício em PDF para testar a importação
```
