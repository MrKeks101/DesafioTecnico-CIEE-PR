# Cadastro via importação de PDF

Cobre `specs.md` linhas 10, 13, 32, 36, 37, 38 e a entrega de um "currículo
fictício em PDF" (linha 71). Depende do formulário e do endpoint de criação
descritos em `cadastro-de-candidatos.md` — este documento cobre apenas o que
é específico do caminho de PDF: upload, validação de arquivo, extração de
texto, e como o resultado chega ao formulário único.

## Descrição

A pessoa pode, opcionalmente, enviar um PDF de currículo em vez de (ou antes
de) preencher o formulário manualmente. O backend lê o PDF, tenta extrair
nome, e-mail e telefone por heurística/regex sobre o texto extraído, e
devolve o que encontrou para pré-preencher o mesmo formulário do cadastro
manual. A pessoa confirma, corrige ou complementa os campos e só então
salva — o salvamento em si usa exatamente o mesmo endpoint e a mesma
validação do cadastro manual (`POST /api/candidates`, ver
`cadastro-de-candidatos.md`). A extração nunca salva nada por si só.

Isso significa dois passos de rede distintos no caminho PDF:
1. `POST /api/candidates/extract` (multipart, arquivo) → devolve campos
   encontrados (ou vazios), nunca persiste.
2. `POST /api/candidates` (JSON, os campos do formulário já revisados pela
   pessoa) → persiste, idêntico ao caminho manual.

## Requisitos funcionais

1. O arquivo é opcional. Sua ausência nunca impede o cadastro manual
   (specs.md linha 13 e 38).
2. Upload aceita apenas PDF, até 5 MB (specs.md linha 36). Limites
   (`MAX_PDF_SIZE_BYTES`, MIME permitido) são constantes exportadas de
   `packages/shared`, para o frontend rejeitar arquivos inválidos antes de
   enviar e o backend aplicar a mesma regra na borda (`multer`), sem
   duplicar o número "5 MB" em dois lugares.
3. Arquivo com tipo ou tamanho inválido: resposta clara e imediata — no
   frontend, antes mesmo de chamar a rede, quando possível; no backend,
   `400` com mensagem explícita (specs.md linha 37: "arquivo inválido").
4. Leitura do PDF é feita inteiramente no backend (specs.md linha 32), via
   `pdf-parse` (decisão em `PROJECT.md`).
5. Falha na leitura do PDF (arquivo corrompido, criptografado, PDF sem
   texto extraível etc.) **não é um erro 500** e **não impede o cadastro
   manual**: a rota de extração responde `200` com campos vazios/parciais e
   uma mensagem clara de aviso (specs.md linha 37: "falha na leitura"; linha
   13: "A ausência do arquivo ou uma falha na leitura não pode impedir o
   cadastro manual"). A pessoa continua podendo preencher e salvar
   manualmente.
6. A extração tenta identificar `fullName`, `email` e `phone` no texto do
   PDF. Não há garantia de sucesso (specs.md linha 38: "Não esperamos que a
   extração funcione perfeitamente com qualquer currículo"). Quando um
   campo não é identificado, ele chega vazio ao formulário para
   preenchimento manual — nunca bloqueia o restante do fluxo.
7. Os campos pré-preenchidos permanecem editáveis; a pessoa pode corrigir
   ou complementar antes de salvar (specs.md linha 10).
8. O endpoint de extração não persiste nada no banco — só o `POST
   /api/candidates` final persiste, reaproveitando a mesma validação do
   cadastro manual.
9. As limitações da heurística de extração (ver abaixo) são documentadas no
   `DESENVOLVIMENTO.md` final (fora do escopo deste PM — é nota para o
   relato do Luiz, não um ticket).

## Heurística de extração — limitações conhecidas (documentar, não resolver)

- **E-mail:** regex padrão de e-mail sobre o texto extraído; se houver mais
  de um e-mail no PDF, o primeiro encontrado é usado — pode não ser o
  e-mail de contato principal.
- **Telefone:** regex cobrindo formatos comuns de telefone brasileiro (com
  e sem DDI/DDD, com e sem separadores); formatos muito fora do padrão
  podem não ser reconhecidos.
- **Nome:** o mais frágil dos três — sem estrutura semântica no texto
  corrido de um PDF, a heurística usa um sinal simples (ex.: primeira linha
  não vazia do texto, ou proximidade a um rótulo como "Nome"); currículos
  com layout em colunas, cabeçalhos gráficos (nome dentro de uma imagem) ou
  ordem de informação atípica podem falhar — nesse caso, o campo fica
  vazio para preenchimento manual, conforme item 6.

## Non-goals

- OCR de PDFs com nome dentro de imagem (texto não extraível por
  `pdf-parse`) — fora de escopo; nesse caso a extração simplesmente não
  encontra nada, tratado pelo item 6 acima.
- Armazenar o PDF original (arquivo binário) em disco ou banco — só os
  campos extraídos (depois revisados) são persistidos.
- Extração de outros campos (`areaOfInterest`, `summary`) a partir do PDF —
  specs.md linha 10 só pede nome, e-mail e telefone.
- Suporte a outros formatos de arquivo (DOCX, imagem, etc.) — specs.md
  linha 36 só exige PDF.

## Questões abertas (com default)

- **Qual trecho de texto usar para "nome":** sem exigência explícita em
  specs.md sobre a técnica. Default: heurística simples e documentada (ver
  seção acima), aceitando taxa de acerto imperfeita — specs.md linha 38
  explicitamente não exige perfeição.
- **Múltiplos e-mails/telefones no texto:** Default: usar a primeira
  ocorrência válida de cada; não tentar adivinhar qual é "o principal".
