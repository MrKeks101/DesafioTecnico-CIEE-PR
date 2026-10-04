# Relato do desenvolvimento

Este documento descreve como organizei e executei o desafio de cadastro de currículos, as decisões técnicas e seus motivos, como usei IA no processo (o método que chamo de **agentic loop**), o que precisei corrigir, como verifiquei a solução e as limitações que ficaram.

## 1. Como organizei o trabalho

### 1.1 Acordo de trabalho antes do código

Antes de escrever qualquer código, criei um `PROJECT.md` com o acordo de trabalho: princípios, estrutura de pastas, stack, papéis, fluxo de git e um log de decisões com a justificativa de cada escolha técnica. O log foi a fonte deste relato.

Cada decisão de stack foi perguntada a mim antes de ser tomada, e eu escolhi com justificativa própria. Para as decisões em que aceitei a sugestão da IA, o motivo registrado é o que a IA sugeriu, não uma resposta genérica copiada em todas.

### 1.2 Agentic loop

O método de trabalho foi um **agentic loop** com quatro papéis, definidos em `.claude/agents/`:

- **Stakeholder (eu):** define o objetivo, decide as prioridades e as escolhas técnicas.
- **Project Manager (agente de IA):** lê `specs.md` e `PROJECT.md`, escreve os requisitos em `docs/requirements/` e quebra o trabalho em tickets pequenos em `docs/tickets/`. Não escreve código de produção.
- **Developer (agente de IA):** pega um ticket, cria a branch, implementa, escreve os testes, roda a suíte, comita, abre a PR e marca "ready for QA". Não aprova nem faz merge.
- **QA e code reviewer (eu):** revisa cada PR, testa a aplicação rodando, aprova e faz o merge. Nenhum agente marca algo como concluído.

O ciclo para cada ticket foi: ticket → branch → implementação e testes → PR → revisão e teste manual por mim → merge → próximo ticket.

Como o desafio tem prazo curto, os tickets foram sequenciados para deixar a aplicação demonstrável de ponta a ponta o quanto antes. O marco foi o ticket 011, com o caminho manual completo (cadastrar, listar, detalhar). Os tickets de importação por PDF (012 a 014) vieram depois, sobre a mesma base.

### 1.3 Sequência de entregas

| Ticket | Entrega | PR |
|---|---|---|
| 001 | Schema de validação compartilhado (Zod) | #1 |
| 002 | Model `Candidate` no Prisma e migration no SQL Server | #2 |
| 003 | Skeleton da API Express (health check, 404, erro) | #3 |
| 004 | `POST /api/candidates` | #4 |
| 005 | `GET /api/candidates` (listagem) | #5 |
| 006 | `GET /api/candidates/:id` (detalhe) | #6 |
| 007 | Infra de testes do frontend (Vitest + RTL) | #7 |
| 008 | Shell da aplicação e navegação | #8 |
| 009 | Formulário de cadastro | #9 |
| 010 | Tela de listagem | #10 |
| 011 | Tela de detalhe (**marco: caminho manual completo**) | #11 |
| 017 | Correção: nome não aceita números (achado de teste manual) | #12 |
| 012 | Módulo de extração de nome, e-mail e telefone do PDF | #13 |
| 018 | Isolamento dos testes do backend do estado do banco | #14 |
| 019 | Correção de tipo no parâmetro `:id` | #15 |
| 013 | `POST /api/candidates/extract` | #16 |
| 014 | Upload de PDF no formulário | #17 |
| — | Refatoração: testes separados do código-fonte | #18 |
| 015 | Currículo fictício em PDF para a entrega | #19 |
| 016 | README com setup, execução e testes | #20 |

Além das PRs, houve commits diretos em `main` para documentação (tickets e este relato) e para o ajuste do lockfile, sempre sem alterar código de produção.

## 2. Decisões técnicas e motivos

As quatro primeiras decisões foram escolhas minhas, com justificativa minha. As demais foram sugeridas pela IA na fase de decisões, e eu aceitei; o motivo de cada uma é o que a IA apontou para o escopo deste desafio.

| Decisão | Motivo |
|---|---|
| **Backend: Node.js (com TypeScript)** | Eu prefiro linguagens compiladas no backend, mas manter a mesma linguagem no frontend e no backend aumenta a coesão do código. |
| **Frontend: React** | Mais simples, e permite uma estrutura de formulários razoável para o escopo. |
| **SQL Server via Docker Compose** | Aumenta a compatibilidade e facilita a execução independente do sistema operacional, além de isolar a instância do banco do resto do ambiente. |
| **TypeScript em todo o projeto** | O desafio não proíbe, e sacrificar tipagem forte no backend é raiz de muitos problemas. TypeScript e JavaScript têm interoperação total, então reverter seria trivial. |
| **Validação com Zod em pacote compartilhado (`packages/shared`)** | O desafio exige "as mesmas regras de validação" nos dois caminhos de cadastro. Um único schema importado pelo formulário e pelo endpoint garante isso por construção, sem manter duas implementações sincronizadas à mão. |
| **Framework backend: Express** | Poucas rotas e nenhuma necessidade de injeção de dependência ou módulos complexos. Express atende com pouco boilerplate, o que importa no prazo de três dias. NestJS teria custo de setup sem retorno neste escopo. |
| **Estrutura: npm workspaces (monorepo)** | Um único repositório com frontend e backend. Um `npm install` na raiz instala tudo, e os scripts de cada pacote rodam dali, o que ajuda no critério de facilidade de configuração. |
| **Extração de PDF: `pdf-parse`** | O requisito é extrair o texto corrido e aplicar regex sobre ele. `pdf-parse` entrega exatamente isso, sem a complexidade de posição e estrutura de página de uma lib como `pdfjs-dist`. |
| **ORM e migrations: Prisma** | O `schema.prisma` serve como documentação do modelo, e `prisma migrate` gera e versiona as migrations, atendendo ao requisito de scripts de criação do banco sem escrever DDL à mão. |
| **Testes: Vitest + React Testing Library + supertest** | Vitest usa o mesmo motor (Vite/esbuild) do build do frontend. RTL testa pela perspectiva do usuário, e supertest exercita as rotas Express reais, com os middlewares de validação, sem abrir porta de rede. |
| **Prisma fixado em `6.12.0`, versão exata** | Um `npm install` sem pin resolveu uma versão RC mais nova, que trazia uma árvore de dependências de deploy em nuvem (`alchemy`, `workerd`) e vulnerabilidades altas. A 6.12.0 não tem essa árvore e não usamos nenhum recurso que exija versão mais nova. |
| **Build do frontend: Vite** | Mesmo motor do Vitest e dev server rápido, com setup mínimo para React e TypeScript. |
| **Validação de nome: sem dígitos (ticket 017)** | Encontrado no teste manual. O schema compartilhado aceita letras de qualquer alfabeto, espaço, hífen e apóstrofo. |

Decisões menores tomadas durante o desenvolvimento estão registradas no log de Decisões do `PROJECT.md`, com data e motivo, como a de rodar os testes do backend em sequência (`fileParallelism: false`), porque todos batem no mesmo SQL Server.

## 3. Ferramentas de IA e modelos

- **Claude Code** (CLI da Anthropic), como ambiente de trabalho.
- **Claude Sonnet 5** como modelo da sessão principal, onde eu conduzia o processo, tomava decisões e revisava os resultados.
- **Agentes `project-manager` e `developer`**, definidos em `.claude/agents/`, configurados para usar o modelo Sonnet.
- O tempo de chamada dos agentes foi de cerca de 1 a 30 minutos por ticket, dependendo do tamanho. Cada agente trabalhou sozinho, sem outro agente no mesmo diretório.

## 4. Em quais etapas a IA ajudou

### 4.1 Planejamento (Project Manager)

Pedi ao agente PM para ler `specs.md` e `PROJECT.md` e gerar os requisitos e os tickets, com este pedido:

> "Este é o kickoff do seu papel neste repositório... escrever os requisitos em `docs/requirements/` e quebrar TODA a implementação do desafio... em tickets pequenos e sequenciados em `docs/tickets/`, lembrando que o prazo é domingo 2026-10-04 23h59 — priorize uma sequência que deixe a aplicação demonstrável de ponta a ponta o mais rápido possível."

Resultado: dois documentos de requisitos e 16 tickets, com ordem recomendada. Aproveitei a estrutura e a ordem; ajustei o que não batia com a realidade do projeto. Por exemplo, os tickets 001 a 003 já existiam como scaffold e não foram refeitos.

### 4.2 Implementação (Developer, um ticket por vez)

Para cada ticket, o pedido era do tipo:

> "Pegue o ticket `docs/tickets/006-candidate-detail-endpoint.md` e entregue-o seguindo suas instruções: leia o ticket e o requirements doc linkado, crie a branch indicada a partir de uma `main` atualizada, implemente, escreva os testes, rode a suíte, comite, e reporte branch, resultado dos testes e o que QA deve observar."

O agente criava a branch, implementava, testava, commitava, dava push e abria a PR. Eu revisava o relatório e a PR antes de mergear, e fazia o teste manual quando o ticket pedia.

Aproveitei a implementação quase inteira. Alguns exemplos do que a IA trouxe e eu aceitei:

- Um handler de `:id` que responde 400 para qualquer valor que não seja string numérica, inclusive array (ticket 019).
- O helper que monta um PDF válido em memória, com offsets do xref calculados no código, para testes sem arquivo binário (ticket 012).
- Um `afterEach(() => cleanup())` explícito no setup de testes do frontend (ticket 008).

### 4.3 Revisão e documentação

A IA também produziu a documentação de cada ticket e as descrições de PR, e ajudou a manter o `PROJECT.md` atualizado com decisões e notas para o README.

## 5. O que precisei corrigir, adaptar ou descartar

Esta seção é importante, porque a IA errou em alguns pontos e eu precisei intervir.

1. **Agentes customizados não apareciam.** Os arquivos em `.claude/agents/` foram criados depois do início da sessão, então o harness não os carregou. Reiniciei a sessão com `claude --continue`, o histórico foi preservado e os agentes passaram a funcionar.

2. **Prisma instalado na versão errada.** Um `npm install` sem versão fixada trouxe uma RC (8.x) com uma árvore de dependências de nuvem e vulnerabilidades. Fixei em `6.12.0` e registrei a decisão.

3. **Commit no branch errado.** Um commit de documentação caiu no branch da feature em vez de `main`, porque o HEAD estava em outro branch. Corrigi com cherry-pick para `main` e restaurei o branch da feature ao estado publicado.

4. **Agentes em paralelo no mesmo diretório.** Dois agentes trabalharam ao mesmo tempo no mesmo working tree, e um trocou de branch por baixo do outro. Nada se perdeu, mas passei a rodar os agentes em sequência.

5. **Bug do npm no Windows, e uma conclusão errada minha.** Binários nativos opcionais (`esbuild`, `rolldown`, `oxlint`, `lightningcss`) não eram instalados de forma confiável. Numa primeira investigação, concluí que regenerar o `package-lock.json` resolvia o problema. Não resolveu: a falha voltou. Corrigi a nota no `PROJECT.md` para dizer que o problema é intermitente, e documentei o workaround.

6. **Testes do backend com estado compartilhado.** Os testes batiam no mesmo banco de dev, e a listagem falhava quando sobrava registro de um teste manual. A correção foi limpar a tabela antes de cada teste de lista (ticket 018). A consequência é que a suíte apaga os candidatos do banco de dev, e isso está no README.

7. **Paralelismo do Vitest causava corrida.** Arquivos de teste rodavam em paralelo contra o mesmo banco. Desativei o paralelismo no backend. No frontend, não precisa, porque não há banco.

8. **Limpeza do RTL não rodava.** Com `globals: false`, o auto-cleanup do Testing Library não é ativado, e o DOM vazava entre testes. Corrigi com um `afterEach` explícito.

9. **Nome aceitando números.** O teste manual mostrou que o `fullName` aceitava dígitos. Abri o ticket 017 e corrigi no schema compartilhado.

10. **Instalações com `--no-save` removem binários de outros pacotes.** Ao instalar um binário nativo específico, os outros eram removidos. Passei a instalar todos juntos, nas versões do lockfile.

11. **Refatoração dos testes.** Movi os testes para pastas próprias e o `sed` que reescreveu os imports deixou de fora um `vi.mock`. Os testes falharam, e corrigi.

## 6. Como verifiquei se a solução estava correta

Verificação em camadas:

- **Testes automatizados** por workspace: `packages/shared` (schemas e constantes), `backend` (rotas com supertest contra o SQL Server real) e `frontend` (componentes com RTL e `fetch` mockado). Ao final, os três estavam verdes: 22, 59 e 37 testes, respectivamente.
- **Builds e lint:** `tsc -b` e `vite build` no frontend e backend, e `oxlint`.
- **Migration em banco limpo:** derrubei o container com o volume, subi de novo, rodei `prisma migrate deploy` e testei create, find e delete com um script.
- **Contrato HTTP ponta a ponta:** create, list, detail e 404 depois do delete, contra a stack viva.
- **Teste manual de fluxo** pelo navegador: cadastrar, listar, abrir o detalhe, testar erros de validação, testar o upload de PDF válido, de arquivo inválido e com o backend desligado.
- **Clone limpo:** testei o README num clone novo, seguindo os passos, e o frontend precisou do workaround documentado para subir no Windows.
- **Auditoria de dependências:** `npm audit` com 0 vulnerabilidades no estado final.

## 7. Tempo aproximado dedicado

Aproximadamente 6 horas, do dia 01 ao dia 03.

## 8. Dificuldades, limitações e melhorias

### 8.1 Limitações da solução

- **Extração de PDF é heurística.** Ela funciona bem em currículos com nome na primeira linha e contatos em texto selecionável. Não identifica nome fora da primeira linha, nem em layouts de várias colunas, nem em PDFs que são imagens. Quando encontra mais de um e-mail, usa o primeiro. Telefones fora dos formatos brasileiros comuns não são reconhecidos.
- **Checagem de tipo pelo MIME do cliente.** Um arquivo renomeado para `.pdf` passa do filtro e cai no parser, que responde 200 com aviso. Não checo a assinatura `%PDF-`.
- **Testes do backend usam o banco de dev.** A suíte apaga a tabela `Candidate` a cada execução.
- **Sem paginação, sem unicidade de e-mail, sem edição nem exclusão.** Nada disso foi pedido no desafio.
- **Telefone sem validação de formato.** Só o e-mail tem validação de formato, como pede o enunciado.
- **Navegação do frontend por estado**, sem rota na URL. Escolha para não adicionar dependência.

### 8.2 Dificuldade de ambiente no Windows

O bug de binários nativos opcionais do npm (`npm/cli#4828`) foi a maior dificuldade operacional. É intermitente, e o workaround documentado no README resolve na maioria das vezes.

**Observação para a avaliação:** esse problema é específico da forma como o npm instala binários opcionais no Windows. Num servidor Linux, que é o ambiente típico para hospedar uma API Web, eu espero que ele não ocorra, porque o npm resolve e instala os binários do próprio Linux pelo fluxo normal. Não testei isso neste projeto, porque a máquina de desenvolvimento é Windows, então registro como expectativa, não como fato verificado. O SQL Server roda num container Docker com imagem Linux, então o banco não depende do sistema do desenvolvedor. A aplicação em si ainda é executada direto no sistema operacional de quem roda, por isso o problema de npm aparece no Windows.

### 8.3 O que faria com mais tempo

- Banco de teste dedicado, separado do de desenvolvimento, para a suíte do backend.
- Checagem da assinatura do PDF no backend, e um teste de extração com currículos reais anonimizados.
- Testes end-to-end no navegador (Playwright), para cobrir o fluxo completo automaticamente.
- CI no GitHub Actions rodando a suíte em Linux a cada PR, o que também cobriria o ponto de ambiente acima.
- Paginação e busca na listagem.
- Validação de telefone em formato brasileiro.
- Rota na URL para as telas, para permitir compartilhar links e usar o botão voltar do navegador.
