# Proposal

## Why

O `game-resume-backend` não possui nenhuma documentação (não há README, nem documentação de API, nem dicionário de dados). Todo o conhecimento do sistema está implícito em ~4.500 linhas de JavaScript, 35 migrations que criam ~57 views e funções PL/pgSQL, e regras de negócio codificadas em SQL interpolado dentro dos handlers. Hoje é impossível manter, migrar tecnologicamente ou recriar o sistema sem ler o código-fonte inteiro.

Esta mudança produz o `SPECIFICATION.md`: um documento mestre de Specification-Driven Development, em pt-BR, derivado por engenharia reversa do código-fonte (fonte da verdade), seguindo o template de 25 seções definido em `Specification-Driven Development.pdf`. O objetivo final é que outro time — ou um agente de IA — consiga recriar banco, backend e integrações do zero, sem acesso ao código original.

## What Changes

- **Novo arquivo `SPECIFICATION.md` na raiz do repositório**, em pt-BR, cobrindo as 25 seções do template do PDF, com diagramas Mermaid (fluxo geral, arquitetura, ER, sequência de autenticação, sincronização Steam, pipelines de exportação).
- **Cobertura exaustiva e verificável**, sem resumos ou simplificações:
  - 52 endpoints REST (32 GET, 14 POST, 4 PUT, 2 DELETE) de `src/app.js`, com método, URL, autenticação, request, response, códigos HTTP e regras aplicadas.
  - API GraphQL completa: 42 campos de `Query`, 28 de `Mutation`, todos os `type`/`input` de `src/schema.js`, resolvers de campo (`dlcs` via DataLoader) e o scalar `Date`.
  - 10 modelos Sequelize, suas associações, tabelas físicas e constraints.
  - Catálogo do banco: tabelas, ~57 views e funções PL/pgSQL (`which_system`, `which_platform`, `which_genre`, `has_dlc`, `restore`, `aft_delete`, `trigger_set_timestamp`, views de estatísticas, gêneros e lixeira), triggers de timestamp e o mecanismo de soft delete via tabela `Trash`.
  - Integrações externas: Steam Web API (`GetOwnedGames`), Gmail/Nodemailer, Puppeteer + EJS (PDF), ExcelJS/json2xls (XLS), json2csv (CSV), upload via Multer e o módulo legado MS Access (`src/queries.js`, marcado `/*Deprecated*/`).
  - Segurança: JWT com dois caminhos distintos (`verifyJWT` para REST, `extractJWTMiddleware` + `authResolver`/`verifyTokenResolver` para GraphQL), hash bcrypt no hook `beforeCreate` de `User`, validação Joi via middleware.
  - Requisitos funcionais (RF) e não funcionais (RNF) reconstruídos a partir do comportamento observado, critérios de aceitação em Gherkin e matriz de rastreabilidade.
- **Registro explícito de ambiguidades e comportamento implícito** encontrados no código, em vez de omiti-los ou "corrigi-los" no texto. Exemplos já identificados na análise preliminar: resolvers consultando as relações `"Origin"` e `"Ubisoft"`, que não possuem modelo Sequelize correspondente; `system_id` numérico usado como constante mágica (1=Origin, 2=Steam, 3=Ubisoft, 4=GameCube, 5=Wii, 6=WiiU); `errorNotification` chamando `notifier`, que nunca é importado; divergência entre `.env.default` e as variáveis realmente lidas (`SECRET`, `DATABASE_URL`, `NODE_ENV`, `PORT`, `STEAM_KEY`, `STEAM_ID`, `EMAIL_AUTH_USER`, `EMAIL_AUTH_PASS`); remetente e destinatário de e-mail fixos no código; `process.env.TZ` fixado em `America/Sao_Paulo`.
- **Seção 19 (Dívida Técnica)** documentando riscos observáveis no código, entre eles a interpolação direta de entrada do usuário em SQL (`searchGame`, `genreSearchGame`, `deleteTrash`, `src/_query.js`), credenciais de banco em claro em `src/config/config.json`, `rejectUnauthorized: false` em produção e o bloco `define` aninhado dentro de `dialectOptions` na configuração de produção.
- **Seção 8 (TELAS) registrada como N/A** — decisão do usuário: este repositório é backend-only. Em vez de inferir telas, a seção documenta o contrato consumido pelo frontend (formatos de payload REST/GraphQL, estrutura de `ChartData`, artefatos de exportação).
- **Nenhuma alteração de código de produção.** Esta mudança é exclusivamente documental.

## Capabilities

### New Capabilities

Nenhuma. A mudança não introduz nem altera comportamento do sistema — documenta o comportamento que já existe.

### Modified Capabilities

Nenhuma. O projeto ainda não possui specs em `openspec/specs/` (`openspec list --specs` retorna vazio), e nenhum requisito do sistema muda.

Por ser uma mudança puramente documental, o artefato `specs` é dispensado via `skip_specs: true` em `.openspec.yaml`. Os critérios de aceitação do documento (cobertura por seção e contagens verificáveis) ficam em `tasks.md`.

## Impact

- **Arquivo criado**: `SPECIFICATION.md` (raiz do repositório).
- **Código de produção afetado**: nenhum. Nada em `src/`, `tests/` ou `utils/` é modificado.
- **Fontes lidas para derivar o documento**: `src/app.js`, `src/requests.js`, `src/resolvers.js`, `src/schema.js`, `src/models/*`, `src/migrations/*` (incluindo os `.sql`), `src/seeders/*`, `src/middleware/`, `src/schema/validation_schema.js`, `src/composable_resolver/*`, `src/dataloader.js`, `src/mailer.js`, `src/exportTocsv.js`, `src/RequestedFields.js`, `src/_query.js`, `src/queries.js`, `src/service.js`, `src/report.ejs`, `src/config/config.json`, `tests/*`, `jest.config.js`, `package.json`, `.sequelizerc`, `.babelrc`, `.env.default`.
- **Consumidores**: time de manutenção, frontend que consome a API, e agentes de IA que usarão o documento como Single Source of Truth para geração de código.
- **Riscos**: o documento pode divergir do código em evoluções futuras; a seção 24 (Histórico de Versões) fixa a data e o commit de referência (`ea6268e`) sobre o qual a especificação foi escrita.
