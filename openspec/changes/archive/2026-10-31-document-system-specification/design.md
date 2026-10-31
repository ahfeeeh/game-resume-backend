# Design

## Context

Motivação em `proposal.md` - Why. O que molda a abordagem aqui é a forma do sistema a ser documentado e as restrições de verificabilidade.

Estado atual relevante:

- **Duas APIs sobre o mesmo banco.** REST (`src/app.js` + `src/requests.js`, 1166 linhas) e GraphQL (`src/schema.js` + `src/resolvers.js`, 1038 linhas) expõem o mesmo domínio por caminhos independentes, com autenticação, formatos de resposta e até fontes de dados diferentes para a mesma informação. Uma seção única de "APIs" não consegue descrever os dois sem ambiguidade.
- **Lógica de negócio no banco.** 35 migrations criam ~57 views e funções PL/pgSQL. Views como `all_games`, `all_pc_games`, `all_console_games`, `all_games_list_api` e as de estatísticas/gêneros não são conveniência: são onde as regras de agregação, percentual e classificação de plataforma vivem. Funções (`which_system`, `which_platform`, `which_genre`, `has_dlc`, `restore`, `aft_delete`, `trigger_set_timestamp`) carregam comportamento que não aparece em nenhum arquivo JS.
- **Migrations usam SQL embutido e arquivos `.sql` paralelos.** Parte do DDL está em strings dentro dos `.js`, parte em `src/migrations/*.sql` (`inheritance.sql`, `constraints.sql`, `views_*.sql`, etc.). O catálogo precisa ser extraído de ambos.
- **O esquema efetivo depende de seeders.** `system_id` é constante mágica nos resolvers (1=Origin, 2=Steam, 3=Ubisoft, 4=GameCube, 5=Wii, 6=WiiU, 7..15=Virtual Console), e esses valores só existem porque o seeder `20220226123358-populate_system.js` os insere nessa ordem.
- **Há código morto, divergente e deprecado no caminho de produção.** `createGames` responde `{success: true}` sem criar nada; `src/queries.js` abre conexão ADODB com um `.accdb` em caminho absoluto e está marcado `/*Deprecated*/`; `errorNotification` chama `notifier`, que nunca é importado; `exportToPDF` navega em `http://localhost:4000/report` com porta fixa, enquanto `.env.default` sugere `PORT=4001`.
- **Backend-only.** Não há frontend neste repositório. As cinco imagens `jogos*.jpeg` na raiz são fotos de caixas físicas de jogos, não telas do sistema.

Restrições:

- Código-fonte é a fonte da verdade; nada pode ser inferido de documentação inexistente.
- Documento único (`SPECIFICATION.md`), em pt-BR, template fixo de 25 seções do `Specification-Driven Development.pdf`.
- Sem resumos, sem simplificação, sem omissão - o critério de pronto é "outro time recria o sistema sem o código original".

## Goals / Non-Goals

**Goals:**

- Definir a estrutura do `SPECIFICATION.md` e o mapeamento arquivo-fonte -> seção, de modo que cada afirmação do documento seja rastreável a um ponto do código.
- Definir como numerar e referenciar BR (regras de negócio), UC (casos de uso), RF e RNF, para que a matriz de rastreabilidade (seção 21) feche.
- Definir o tratamento uniforme de ambiguidade e comportamento implícito, para que apareçam no documento em vez de serem silenciosamente normalizados.
- Definir o conjunto de diagramas Mermaid e o que cada um precisa mostrar.
- Definir critérios de cobertura contáveis (nº de endpoints, campos GraphQL, tabelas, views, funções) que possam ser conferidos contra o repositório.

**Non-Goals:**

- Corrigir, refatorar ou "melhorar" o código ao documentá-lo. Divergências são registradas, não resolvidas.
- Propor arquitetura nova. A seção 20 (Roadmap de Modernização) descreve caminhos possíveis; não é um plano aprovado.
- Documentar o frontend. Seção 8 é N/A por decisão do usuário.
- Criar specs OpenSpec em `openspec/specs/` (ver `proposal.md` - Capabilities).
- Executar a aplicação ou o banco para observar comportamento em runtime. A derivação é estática, por leitura de código. Onde o comportamento em runtime for indeterminável estaticamente, isso vira ambiguidade registrada.

## Decisions

### D1. Template do PDF é normativo: 25 seções, na ordem, nenhuma suprimida

O documento segue exatamente a numeração e os títulos do `Specification-Driven Development.pdf` (1. Visão Geral ... 25. Aprovações, mais a Regra Final). Seções sem conteúdo aplicável a este repositório (8. Telas) permanecem no documento com marcação explícita `N/A - backend-only` e justificativa, em vez de serem removidas.

*Alternativa considerada:* adaptar o template, removendo seções de frontend. *Rejeitada:* o template é o contrato de SDD do usuário; a ausência de uma seção seria indistinguível de um esquecimento, e a numeração quebraria a rastreabilidade com outros documentos gerados pelo mesmo template.

### D2. Separar a seção 7 (APIs) em 7.1 REST e 7.2 GraphQL, com ficha fixa por operação

REST e GraphQL não compartilham autenticação nem contrato. Cada endpoint REST recebe uma ficha: método, URL, descrição, autenticação (`verifyJWT` ou público), middlewares (Multer, Joi), request (params/query/body com tipos), response (JSON literal), códigos HTTP observados e BRs aplicadas. Cada campo GraphQL recebe: assinatura SDL, guarda (`authGuard` ou aberto), SQL/ORM efetivamente executado, resolvers de campo envolvidos e BRs aplicadas.

*Alternativa considerada:* uma tabela única cobrindo as duas APIs. *Rejeitada:* colunas como "middleware" e "guarda de resolver" não se aplicam entre si, e o leitor perderia que o mesmo dado (ex.: jogos de Steam) vem de `Games WHERE system_id = 2` no GraphQL e de `db.Game.findAll` no REST.

### D3. O banco é documentado como componente de primeira classe, não como apêndice do ORM

A seção 6 cataloga, com DDL reconstruído: tabelas (colunas, tipos, nulidade, chaves, constraints, índices), views (nome, objetivo, SQL, consumidores), funções PL/pgSQL (assinatura, corpo, onde é chamada) e triggers. Views e funções entram também na seção 3 (Regras de Negócio) quando carregam regra, com BR própria.

*Alternativa considerada:* documentar só os modelos Sequelize e tratar views como detalhe de implementação. *Rejeitada:* a maior parte das estatísticas e das classificações de plataforma/gênero só existe em SQL; sem elas o banco não é recriável e metade das respostas da API fica inexplicada.

### D4. Numeração estável e rastreável: BR/UC/RF/RNF/DT

Identificadores sequenciais por família (`BR-001`, `UC-001`, `RF-001`, `RNF-001`, `DT-001`), atribuídos na ordem em que o tema aparece no documento, nunca reutilizados. Toda BR aponta arquivo, função e linha de origem. A matriz da seção 21 (RF x UC x Tela x API x Serviço x Entidade x Tabela) é preenchida a partir dessas referências cruzadas, com `N/A` na coluna Tela.

*Alternativa considerada:* agrupar por módulo sem numeração global. *Rejeitada:* a seção 21 do template exige rastreabilidade cruzada, que depende de identificadores globais.

### D5. Ambiguidades e comportamento implícito ficam inline, marcados, e também consolidados

Onde a ambiguidade ocorre, o texto recebe um bloco marcado `> **AMBIGUIDADE (AMB-nnn)**` ou `> **COMPORTAMENTO IMPLÍCITO (IMP-nnn)**`, com: o que o código faz, por que é ambíguo/implícito, e a referência `arquivo:linha`. Todos são reunidos na seção 23 (Anexos) em uma tabela índice.

*Alternativa considerada:* concentrar tudo apenas num capítulo de ambiguidades. *Rejeitada:* quem lê a ficha de um endpoint precisa ver ali que o comportamento é incerto; um capítulo isolado é lido depois (ou nunca). A consolidação em anexo cobre o caso oposto - revisar todas de uma vez.

### D6. Dívida técnica descreve o risco observado, sem exploit

A seção 19 registra, entre outros: interpolação de entrada do usuário em SQL (`searchGame`, `genreSearchGame`, `deleteTrash`, construtores em `src/_query.js`), credenciais em claro em `src/config/config.json`, `rejectUnauthorized: false` em produção, segredo JWT sem rotação, `uncaughtException` que mantém o processo vivo, e o bloco `define` aninhado erroneamente dentro de `dialectOptions` na configuração de produção. Cada item traz arquivo, severidade, impacto e sugestão - descrição da classe do problema, nunca um payload funcional.

### D7. Oito diagramas Mermaid, cada um com um papel distinto

1. Fluxo geral (seção 1.3) - usuário -> API -> banco -> Steam/e-mail.
2. Arquitetura em camadas (2.2) - Express/GraphQL -> requests/resolvers -> Sequelize e SQL bruto -> PostgreSQL, com os middlewares no caminho.
3. Estrutura de módulos (2.3) - dependências entre `app`, `requests`, `resolvers`, `schema`, `models`, `dataloader`, `composable_resolver`, `mailer`, `exportTocsv`, `_query`.
4. ER do domínio (5) - `Games`, `System`, `DLC`, `Playing`, `Category`, `GamesCategories`, `VirtualConsole`, `ToBuy`, `CodeAndTip`, `Trash`, `User`, com cardinalidades.
5. Sequência de autenticação (9) - login, emissão de JWT, `verifyJWT` no REST e `extractJWTMiddleware` + `authResolver`/`verifyTokenResolver` no GraphQL, os dois caminhos no mesmo diagrama para evidenciar a diferença.
6. Sequência de sincronização Steam (10) - `requestSteamGames` -> Steam Web API -> comparação -> persistência.
7. Pipeline de exportação (10/11) - `/report` (EJS) -> Puppeteer -> PDF; e as rotas CSV/XLS.
8. Ciclo de soft delete e restauração (6) - `aft_delete` -> `Trash` -> `restore()` -> `POST /restore`.

*Alternativa considerada:* um diagrama por seção, inclusive onde o texto basta. *Rejeitada:* diagrama redundante envelhece e desinforma; estes oito cobrem o que é difícil de ler em prosa.

### D8. Derivação estática, verificada por contagem

O documento é escrito lendo o código, e a cobertura é conferida por contagens extraídas do próprio repositório (52 rotas em `src/app.js`, 42 campos de `Query`, 28 de `Mutation`, 10 modelos, 35 migrations, 9 seeders, ~57 views/funções). Essas contagens viram itens de verificação em `tasks.md`.

*Alternativa considerada:* subir a aplicação e o PostgreSQL para inspecionar o esquema real (`information_schema`) e respostas reais. *Rejeitada para este escopo:* exigiria banco, credenciais, chave Steam e conta de e-mail; além disso o esquema em runtime seria uma segunda fonte-da-verdade concorrendo com o código. Fica registrado como limitação e alimenta `AMB-nnn` onde a leitura estática não decide.

### D9. pt-BR no texto, identificadores preservados no original

Prosa, títulos e tabelas em português. Nomes de tabelas, colunas, views, funções, endpoints, campos GraphQL, variáveis de ambiente e trechos de código permanecem exatamente como no código (`all_games`, `fisical_disc`, `which_system`, `/tobuy`), sem tradução, inclusive quando contêm erro de grafia do original.

## Risks / Trade-offs

- **Documento diverge do código na primeira alteração futura** -> a seção 24 fixa versão, data e commit de referência (`ea6268e`); a regra final do documento indica que qualquer alteração de rota, modelo, view ou função deve atualizar a seção correspondente.
- **Derivação estática pode descrever comportamento que nunca ocorre em produção** (ex.: `createGames` como stub, módulo ADODB deprecado) -> esses casos são marcados como `IMP-nnn`/`DT-nnn` com a observação explícita de que o código existe mas o efeito é nulo ou inalcançável, em vez de descritos como funcionalidade.
- **Volume: o documento tenderá a centenas de páginas e fica difícil de revisar** -> trade-off aceito conscientemente (o requisito é "não resumir"); mitigado por índice, numeração estável, tabelas-resumo no início das seções 6 e 7 e pela matriz da seção 21.
- **Views e funções com SQL longo inflam a seção 6** -> o DDL completo entra no documento (é requisito de recriação do banco), mas antecedido de uma linha de objetivo e da lista de consumidores, para que o leitor não precise ler o SQL para entender o papel.
- **Risco de "inventar" requisitos ao reconstruir RF/RNF** -> toda RF cita a origem (endpoint, resolver, view ou teste); RNF só é registrada quando há evidência no código (ex.: DataLoader para N+1, `--runInBand` nos testes, timezone fixo), e metas numéricas ausentes são declaradas como "não definida no código" em vez de estimadas.
- **`.env.default` incompleto induz erro na seção 12** -> a tabela de variáveis é montada a partir dos `process.env.*` encontrados no código, não de `.env.default`; a divergência entre os dois vira AMB registrada.
