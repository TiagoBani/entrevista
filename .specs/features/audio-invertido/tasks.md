# Reprodução de áudio invertido Tasks

## Execution Protocol

Implementar com a skill tlc-spec-driven. Cada tarefa exige teste, gate e commit atômico. A verificação final percorre todos os critérios.

**Design**: `.specs/features/audio-invertido/design.md`
**Status**: In Progress
**Approved**: 2026-11-25 - user: "pode avançar"
**Build**: none - projeto ESM novo, sem compilação ou linter configurado antes de T1
**Run unit**: `npm run test:unit`
**Run integration**: `npm run test:integration`
**Run e2e**: `npm run test:e2e`

## Test Coverage Matrix

> No repositório há README e skills, sem testes ou diretrizes de qualidade. O usuário autorizou avançar com este plano e com o padrão proposto em 2026-11-25.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Módulos de áudio puros | unit | Todos os ramos, ACs e fronteiras de bloco | `tests/unit/*.test.mjs` | `npm run test:unit` |
| Adaptadores FFmpeg, armazenamento, fila e HTTP | integration | Caminhos principais, falhas e casos de borda de cada rota | `tests/integration/*.test.mjs` | `npm run test:integration` |
| Telas e player | e2e | Gestos, estados vazio/processando/concluído/falhou e downloads | `tests/e2e/*.test.mjs` | `npm run test:e2e` |
| Manifesto e documentação | none | Verificação de comandos e instruções no gate | - | `npm test` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Após módulo puro com teste unitário | `npm run test:unit` |
| Full | Após integração ou tela | `npm test` |
| Build | Antes de T1, sem aplicação existente | none - o manifesto ainda não existe |

## Execution Plan

As fases são sequenciais e as tarefas de cada fase seguem as setas. Cada seta representa a dependência declarada no destino.

### Phase 1: Base e entrada

```
T1 → T2 → T3 → T4
```

### Phase 2: Processamento de áudio

```
T5 → T6 → T7 → T8
```

### Phase 3: Trabalho e HTTP

```
T9 → T10 → T11
```

### Phase 4: Telas

```
T12 → T13 → T14 → T15 → T16 → T17
```

### Phase 5: Operação

```
T18
```

As dependências entre fases são:

```
T4 → T5
T8 → T9
T11 → T12
T17 → T18
```

## Task Breakdown

### T1: Criar manifesto e comandos do projeto

**What**: Define Node 24, scripts de teste e dependência de desenvolvimento Playwright.
**Where**: `package*.json`
**Depends on**: None
**Reuses**: Node.js 24 nativo
**Requirement**: AUD-31

**Done when**:

- [x] Define Node 24, scripts de teste e dependência de desenvolvimento Playwright.
- [x] O manifesto e o lockfile fixam Node 24 e Playwright; os comandos `test`, `test:unit`, `test:integration` e `test:e2e` estão declarados e `npm test` executa sem erro.

**Tests**: none
**Gate**: full

---

### T2: Persistir trabalhos e transições

**What**: Cria esquema, paginação, transições atômicas e recuperação de estados.
**Where**: `src/job-store.mjs`
**Depends on**: T1
**Reuses**: node:sqlite
**Requirement**: AUD-07, AUD-09, AUD-11, AUD-15

**Done when**:

- [x] Cria esquema, paginação, transições atômicas e recuperação de estados.
- [x] 5 testes da camada passam no gate `npm test`.

**Tests**: integration
**Gate**: full

---

### T3: Receber MP3 por stream

**What**: Grava upload sem limite de tamanho em arquivo parcial e limpa interrupções.
**Where**: `src/modules/audio-input.mjs`
**Depends on**: T2
**Reuses**: node:stream/promises
**Requirement**: AUD-01, AUD-13, AUD-16

**Done when**:

- [ ] Grava upload sem limite de tamanho em arquivo parcial e limpa interrupções.
- [ ] 4 testes da camada passam no gate `npm test`.

**Tests**: integration
**Gate**: full

---

### T4: Inspecionar MP3 de entrada

**What**: Reconhece MP3, taxa e canais; rejeita entrada inválida.
**Where**: `src/modules/file-reader.mjs`
**Depends on**: T3
**Reuses**: ffprobe
**Requirement**: AUD-01, AUD-16

**Done when**:

- [ ] Reconhece MP3, taxa e canais; rejeita entrada inválida.
- [ ] 4 testes da camada passam no gate `npm test`.

**Tests**: integration
**Gate**: full

---

### T5: Decodificar MP3 para PCM temporário

**What**: Produz f32le em disco sem carregar o áudio inteiro.
**Where**: `src/modules/audio-decoder.mjs`
**Depends on**: T4
**Reuses**: FFmpeg
**Requirement**: AUD-02, AUD-03, AUD-04

**Done when**:

- [ ] Produz f32le em disco sem carregar o áudio inteiro.
- [ ] 3 testes da camada passam no gate `npm test`.

**Tests**: integration
**Gate**: full

---

### T6: Inverter quadros PCM em blocos

**What**: Lê do fim, inverte quadros sem trocar canais e limita cada bloco a 16 MiB.
**Where**: `src/modules/audio-reverser.mjs`
**Depends on**: T5
**Reuses**: node:fs/promises
**Requirement**: AUD-02, AUD-14, AUD-33

**Done when**:

- [ ] Lê do fim, inverte quadros sem trocar canais e limita cada bloco a 16 MiB.
- [ ] 6 testes da camada passam no gate `npm run test:unit`.

**Tests**: unit
**Gate**: quick

---

### T7: Codificar fluxo invertido em MP3

**What**: Consome blocos com backpressure em uma codificação VBR 0.
**Where**: `src/modules/audio-encoder.mjs`
**Depends on**: T6
**Reuses**: FFmpeg libmp3lame
**Requirement**: AUD-03, AUD-04, AUD-06

**Done when**:

- [ ] Consome blocos com backpressure em uma codificação VBR 0.
- [ ] 3 testes da camada passam no gate `npm test`.

**Tests**: integration
**Gate**: full

---

### T8: Publicar e entregar arquivo invertido

**What**: Valida saída, publica atomicamente e serve Range/attachment sem parcial.
**Where**: `src/modules/reversed-file.mjs`
**Depends on**: T7
**Reuses**: node:fs, file-reader
**Requirement**: AUD-05, AUD-10, AUD-17, AUD-18

**Done when**:

- [ ] Valida saída, publica atomicamente e serve Range/attachment sem parcial.
- [ ] 4 testes da camada passam no gate `npm test`.

**Tests**: integration
**Gate**: full

---

### T9: Executar cadeia de áudio na worker thread

**What**: Executa fases e envia mensagens de estado e resultado à thread principal.
**Where**: `src/job-worker.mjs`
**Depends on**: T8
**Reuses**: sete módulos de áudio
**Requirement**: AUD-02, AUD-15, AUD-23

**Done when**:

- [ ] Executa fases e envia mensagens de estado e resultado à thread principal.
- [ ] 4 testes da camada passam no gate `npm test`.

**Tests**: integration
**Gate**: full

---

### T10: Orquestrar fila e recuperação

**What**: Executa um trabalho por vez e recupera estados após reinício.
**Where**: `src/job-runner.mjs`
**Depends on**: T9
**Reuses**: job-store, node:worker_threads
**Requirement**: AUD-09, AUD-11, AUD-17, AUD-23

**Done when**:

- [ ] Executa um trabalho por vez e recupera estados após reinício.
- [ ] 5 testes da camada passam no gate `npm test`.

**Tests**: integration
**Gate**: full

---

### T11: Servir upload, lista, estado e arquivos

**What**: Entrega rotas HTTP com upload em stream e downloads públicos.
**Where**: `src/http-server.mjs`
**Depends on**: T10
**Reuses**: job-store, audio-input, file-reader, reversed-file
**Requirement**: AUD-01, AUD-05, AUD-07, AUD-08, AUD-10, AUD-12, AUD-13, AUD-16, AUD-18

**Done when**:

- [ ] Entrega rotas HTTP com upload em stream e downloads públicos.
- [ ] 10 testes da camada passam no gate `npm test`.

**Tests**: integration
**Gate**: full

---

### T12: Criar página base da aplicação

**What**: Cria o HTML base que carrega os módulos da interface, a área das três telas e os controles acessíveis.
**Where**: `public/index.html`
**Depends on**: T11
**Reuses**: rotas HTTP
**Requirement**: AUD-19, AUD-31

**Done when**:

- [ ] O HTML base carrega a interface no mesmo servidor.
- [ ] 2 testes de navegador passam no gate `npm test`.

**Tests**: e2e
**Gate**: full

---

### T13: Montar tela inicial e lista pública

**What**: Mostra escolha de MP3, nome, botão Inverter áudio e lista pública.
**Where**: `public/app.mjs`
**Depends on**: T12
**Reuses**: rotas HTTP
**Requirement**: AUD-19, AUD-20, AUD-21

**Done when**:

- [ ] Mostra escolha de MP3, nome, botão Inverter áudio e lista pública.
- [ ] A navegação para processamento e resultado usa imports sob demanda dos módulos das tarefas seguintes.
- [ ] 4 testes da camada passam no gate `npm test`.

**Tests**: e2e
**Gate**: full

---

### T14: Montar tela de processamento

**What**: Mostra ícone, estado, retomada e falha com original.
**Where**: `public/processing.mjs`
**Depends on**: T13
**Reuses**: rotas HTTP, app.mjs
**Requirement**: AUD-22, AUD-23, AUD-28

**Done when**:

- [ ] Mostra ícone, estado, retomada e falha com original.
- [ ] 4 testes da camada passam no gate `npm test`.

**Tests**: e2e
**Gate**: full

---

### T15: Criar módulo de reprodução

**What**: Controla play, pause e busca do MP3 invertido.
**Where**: `public/modules/playback.mjs`
**Depends on**: T14
**Reuses**: HTMLAudioElement
**Requirement**: AUD-25, AUD-26, AUD-27, AUD-33

**Done when**:

- [ ] Controla play, pause e busca do MP3 invertido.
- [ ] 4 testes da camada passam no gate `npm test`.

**Tests**: e2e
**Gate**: full

---

### T16: Montar tela de resultado

**What**: Mostra player e dois downloads e abre após conclusão ou pela lista.
**Where**: `public/result.mjs`
**Depends on**: T15
**Reuses**: playback.mjs, rotas HTTP
**Requirement**: AUD-24, AUD-29, AUD-30

**Done when**:

- [ ] Mostra player e dois downloads e abre após conclusão ou pela lista.
- [ ] 5 testes da camada passam no gate `npm test`.

**Tests**: e2e
**Gate**: full

---

### T17: Aplicar estilos às três telas

**What**: Aplica a apresentação e os estados visuais das telas de envio, processamento e resultado.
**Where**: `public/styles.css`
**Depends on**: T16
**Reuses**: `public/index.html`
**Requirement**: AUD-19, AUD-22, AUD-24

**Done when**:

- [ ] As três telas e seus estados permanecem legíveis no navegador.
- [ ] 2 testes de navegador passam no gate `npm test`.

**Tests**: e2e
**Gate**: full

---

### T18: Documentar execução e armazenamento

**What**: Explica Node 24, FFmpeg, DATA_DIR persistente, comandos e natureza pública.
**Where**: `README.md`
**Depends on**: T17
**Reuses**: design aprovado
**Requirement**: AUD-31, AUD-32

**Done when**:

- [ ] Explica Node 24, FFmpeg, DATA_DIR persistente, comandos e natureza pública.
- [ ] Comandos e instruções são verificados no gate `npm test`.

**Tests**: none
**Gate**: full

---

## Checks

**C1** - WHEN um visitante envia um arquivo com cabeçalho e quadro MP3 reconhecíveis THEN the system SHALL criar um trabalho com identificador único e estado visível `na fila`. (AUD-01, AC 1)
Proof: run integration | ✔ AUD-01 upload cria trabalho na fila

**C2** - WHEN o processamento termina com sucesso THEN the system SHALL gerar um MP3 a partir dos quadros PCM da entrada em ordem temporal inversa, mantendo juntos os canais de cada quadro antes da codificação. (AUD-02, AC 2)
Proof: run integration | ✔ AUD-02 PCM invertido preserva quadros de canais

**C3** - WHEN o MP3 invertido é gerado THEN the system SHALL preservar a taxa de amostragem e o número de canais da entrada. (AUD-03, AC 3)
Proof: run integration | ✔ AUD-03 saída preserva taxa e canais

**C4** - WHEN o MP3 invertido é gerado THEN the system SHALL manter a diferença de duração decodificada em no máximo um quadro MP3 na taxa de amostragem da entrada. (AUD-04, AC 4)
Proof: run integration | ✔ AUD-04 duração difere até um quadro MP3

**C5** - WHEN um trabalho termina com sucesso THEN the system SHALL oferecer download do MP3 original e do MP3 invertido com tipos de conteúdo e nomes de arquivo identificáveis. (AUD-05, AC 5)
Proof: run integration | ✔ AUD-05 dois arquivos são baixáveis

**C6** - The system SHALL decodificar a entrada uma vez e codificar a saída uma vez com LAME VBR qualidade 0, sem outra recodificação com perdas. (AUD-06, AC 6)
Proof: run integration | ✔ AUD-06 uma única recodificação VBR 0

**C7** - WHEN um visitante abre a página THEN the system SHALL mostrar uma lista pública de trabalhos com identificador e estado `na fila`, `processando`, `concluído` ou `falhou`. (AUD-07, AC 1)
Proof: run integration | ✔ AUD-07 lista mostra estados públicos

**C8** - WHEN não há trabalhos THEN the system SHALL mostrar o estado vazio `Nenhum trabalho enviado` e o controle de envio de MP3. (AUD-08, AC 2)
Proof: run e2e | ✔ AUD-08 estado vazio mostra envio

**C9** - WHEN um visitante recarrega a página ou volta em outra sessão THEN the system SHALL mostrar os trabalhos e os estados persistidos, sem exigir login. (AUD-09, AC 3)
Proof: run integration | ✔ AUD-09 estados persistem após retorno

**C10** - WHEN um visitante abre um trabalho concluído na lista THEN the system SHALL mostrar a tela de resultado com player do invertido e os links de download do original e do invertido. (AUD-10, AC 4)
Proof: run e2e | ✔ AUD-10 lista abre resultado

**C11** - The system SHALL manter os trabalhos, os originais válidos e os MP3 invertidos sem expiração ou exclusão automática, inclusive após reinício da aplicação. (AUD-11, AC 5)
Proof: run integration | ✔ AUD-11 arquivos não expiram

**C12** - The system SHALL permitir que qualquer visitante acesse a lista pública e baixe os arquivos de trabalhos concluídos sem login. (AUD-12, AC 6)
Proof: run integration | ✔ AUD-12 downloads públicos sem login

**C13** - The system SHALL aceitar um MP3 com cabeçalho e quadro reconhecíveis sem rejeitá-lo por um limite de tamanho configurado na aplicação. (AUD-13, AC 1)
Proof: run integration | ✔ AUD-13 upload não impõe tamanho máximo

**C14** - WHILE um trabalho está `processando` the system SHALL ler, inverter e gravar o áudio em blocos com limite fixo de até 16 MiB de dados de áudio por bloco, sem carregar o arquivo inteiro na memória. (AUD-14, AC 2)
Proof: run unit | ✔ AUD-14 memória limitada e blocos não excedem 16 MiB

**C15** - The system SHALL executar trabalhos sem prazo máximo de processamento imposto pela aplicação. (AUD-15, AC 3)
Proof: run integration | ✔ AUD-15 trabalho não tem prazo máximo

**C16** - IF o envio não contém cabeçalho e quadro MP3 reconhecíveis THEN the system SHALL informar `Arquivo MP3 inválido ou não suportado` e não publicar o envio como trabalho. (AUD-16, AC 4)
Proof: run integration | ✔ AUD-16 arquivo inválido é rejeitado

**C17** - IF o processamento falha após a aceitação do MP3 THEN the system SHALL marcar o trabalho como `falhou`, manter o MP3 original disponível e não oferecer download de um MP3 invertido parcial. (AUD-17, AC 5)
Proof: run integration | ✔ AUD-17 falha mantém original sem saída parcial

**C18** - IF não há espaço de armazenamento suficiente THEN the system SHALL marcar o trabalho como `falhou` com motivo de falta de espaço e manter qualquer arquivo original já aceito. (AUD-18, AC 6)
Proof: run integration | ✔ AUD-18 falta de espaço marca falha

**C19** - WHEN um visitante abre a tela inicial THEN the system SHALL mostrar um botão para escolher um arquivo MP3 e a lista pública de trabalhos. (AUD-19, AC 1)
Proof: run e2e | ✔ AUD-19 início mostra escolha e lista

**C20** - WHEN um visitante usa o botão de escolha THEN the system SHALL abrir o seletor de arquivos do navegador para selecionar um MP3. (AUD-20, AC 2)
Proof: run e2e | ✔ AUD-20 botão abre seletor MP3

**C21** - WHEN um visitante seleciona um arquivo THEN the system SHALL mostrar o nome do arquivo e habilitar o controle `Inverter áudio`. (AUD-21, AC 3)
Proof: run e2e | ✔ AUD-21 seleção mostra nome e habilita envio

**C22** - WHEN um visitante aciona `Inverter áudio` com um MP3 aceito THEN the system SHALL mostrar a tela de processamento com ícone de atividade, identificador do trabalho e estado atual. (AUD-22, AC 4)
Proof: run e2e | ✔ AUD-22 envio mostra processamento

**C23** - WHILE a tela de processamento está aberta ou fechada THEN the system SHALL continuar o trabalho em segundo plano até `concluído` ou `falhou`, sem depender da conexão da página após o envio. (AUD-23, AC 5)
Proof: run integration | ✔ AUD-23 trabalho continua após fechar página

**C24** - WHEN o trabalho é concluído e o visitante está na tela de processamento THEN the system SHALL mostrar a tela de resultado com um player do MP3 invertido e links de download do original e do invertido. (AUD-24, AC 6)
Proof: run e2e | ✔ AUD-24 conclusão abre resultado

**C25** - WHEN um visitante aciona `Reproduzir` no player THEN the system SHALL tocar o MP3 invertido do ponto atual. (AUD-25, AC 7)
Proof: run e2e | ✔ AUD-25 player reproduz invertido

**C26** - WHEN um visitante aciona `Pausar` no player THEN the system SHALL interromper a reprodução e manter a posição atual. (AUD-26, AC 8)
Proof: run e2e | ✔ AUD-26 player pausa mantendo posição

**C27** - WHEN um visitante altera a posição no player THEN the system SHALL continuar a reprodução do MP3 invertido a partir da posição escolhida. (AUD-27, AC 9)
Proof: run e2e | ✔ AUD-27 player busca posição

**C28** - IF o trabalho termina em `falhou` enquanto a tela de processamento está aberta THEN the system SHALL mostrar o motivo da falha e o link para baixar o MP3 original aceito. (AUD-28, AC 10)
Proof: run e2e | ✔ AUD-28 falha aparece na tela

**C29** - WHEN um visitante aciona o link `Baixar original` THEN the system SHALL baixar o MP3 original desse trabalho. (AUD-29, AC 11)
Proof: run e2e | ✔ AUD-29 link baixa original

**C30** - WHEN um visitante aciona o link `Baixar invertido` THEN the system SHALL baixar o MP3 invertido desse trabalho. (AUD-30, AC 12)
Proof: run e2e | ✔ AUD-30 link baixa invertido

**C31** - The system SHALL entregar interface web e processamento como uma única aplicação e um único projeto executável. (AUD-31, AC 1)
Proof: run integration | ✔ AUD-31 aplicação é única

**C32** - The system SHALL ter módulos separados e identificáveis para `Arquivo de áudio`, `Leitura do arquivo`, `Decodificação do áudio`, `Inversão do áudio`, `Codificação do áudio`, `Arquivo de áudio invertido` e `Reprodução`. (AUD-32, AC 2)
Proof: run unit | ✔ AUD-32 sete módulos são separados

**C33** - The system SHALL permitir testar cada um dos sete módulos separadamente por sua interface pública interna, sem executar todo o fluxo web. (AUD-33, AC 3)
Proof: run unit | ✔ AUD-33 sete módulos são testáveis isoladamente

## Handoff

**Settled mid-build:** none
**Dispatched:** none
**Walked:** none

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
Phase 1: Base e entrada: T1 → T2 → T3 → T4
Phase 2: Processamento de áudio: T5 → T6 → T7 → T8
Phase 3: Trabalho e HTTP: T9 → T10 → T11
Phase 4: Telas: T12 → T13 → T14 → T15 → T16 → T17
Phase 5: Operação: T18
```

## Task Granularity Check

Cada tarefa tem um arquivo principal ou um componente único. Testes são escritos na mesma tarefa de seu código; T11 reúne rotas do componente HTTP e será verificado por integração.

## Diagram-Definition Cross-Check

As setas de cada fase coincidem com `Depends on`; o primeiro item de cada fase depende do último da fase anterior.

## Test Co-location Validation

T2–T10 e T11 incluem testes de integração ou unidade conforme a matriz. T12–T17 incluem testes de navegador. T1 e T18 só alteram manifesto/documentação e usam `Tests: none`.

