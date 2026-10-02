# 015 — Currículo fictício em PDF (entrega + fixture de teste)

**Branch:** `chore/sample-resume-fixture`

**Requisitos:** `specs.md` linha 71 ("Um currículo fictício em PDF para
testar a importação" — item obrigatório da entrega).

**Dependências:** 012 (módulo de extração, para validar que o fixture é
extraível). Pode compartilhar o mesmo arquivo usado como fixture no
ticket 013 — se aquele ticket já criou um PDF de teste, este ticket só
precisa promovê-lo/copiá-lo para `samples/` com dados apresentáveis, em
vez de gerar um novo.

## O que fazer

Criar um PDF de currículo **inteiramente fictício** (nome, e-mail,
telefone inventados — sem PII real) em `samples/`, com layout simples o
bastante para que a heurística do ticket 012 encontre os três campos:

- Nome completo em destaque (ex. primeira linha/topo do documento).
- E-mail em formato padrão, claramente identificável.
- Telefone em um dos formatos brasileiros comuns cobertos pela regex do
  ticket 012.
- Conteúdo adicional plausível de currículo (experiência, formação) para
  não parecer um arquivo de teste vazio — reforça que a extração funciona
  em um documento "realista", não só em um texto minimalista.

Nome de arquivo sugerido: `samples/curriculo-ficticio.pdf`.

## Critérios de aceite

- [ ] Arquivo existe em `samples/`, é um PDF válido, abre normalmente, e
      tem menos de 5 MB.
- [ ] Nenhum dado real de uma pessoa de verdade — tudo fictício.
- [ ] Passado pela extração do ticket 012 (`extractTextFromPdf` +
      `extractCandidateFields`), os três campos (`fullName`, `email`,
      `phone`) são corretamente identificados — confirmar isso manualmente
      ou com um script local antes de commitar (não precisa virar teste
      automatizado permanente, mas pode reaproveitar/alimentar os fixtures
      de teste do ticket 013).

## Testes esperados

Nenhum teste automatizado novo exigido por este ticket em si (é um
asset). Se o ticket 013 ainda não tiver seu próprio fixture de PDF válido,
este arquivo pode ser referenciado por aquele conjunto de testes.
