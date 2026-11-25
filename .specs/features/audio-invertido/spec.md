# Reprodução de áudio invertido Specification

**Approved**: 2026-11-25 - user: "está aprovado, vamos para a proxima fase"

**Status:** aprovado para desenho

## Problem Statement

Uma pessoa precisa enviar um MP3 e obter uma nova gravação que toque do fim para o começo. A inversão deve ocorrer nas amostras de áudio decodificadas, preservando a duração e a organização dos canais. A primeira entrega será uma aplicação web pública, sem login, que mantém os trabalhos e os dois arquivos sem expiração automática. O fluxo visível terá telas de envio, processamento e resultado; a última terá player e downloads.

## Goals

- [ ] Inverter o conteúdo sonoro de um MP3 e gerar outro MP3 baixável.
- [ ] Processar arquivos sem limite de tamanho ou tempo imposto pela aplicação, com blocos de memória limitados.
- [ ] Permitir acompanhamento e download posterior dos trabalhos em uma lista pública persistente.
- [ ] Permitir ouvir o MP3 invertido na tela de resultado.
- [ ] Manter cada etapa do fluxo de áudio em um módulo distinto e inspecionável dentro de uma única aplicação.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Login, contas e permissões por usuário | O usuário definiu acesso público sem login para a primeira entrega. |
| Ferramenta de linha de comando ou API pública | A primeira entrega será somente uma página web. |
| WAV e outros formatos | O usuário definiu MP3 como formato único de entrada e saída. |
| Aplicações separadas para frontend e backend | A arquitetura solicitada mantém um único projeto web modular. |
| Exclusão e expiração automática de arquivos | O usuário determinou retenção sem expiração automática. |

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Qualidade com saída MP3 | Preservar taxa de amostragem e número de canais; decodificar uma vez e recodificar uma vez com LAME VBR qualidade 0. | MP3 é um formato com perdas; VBR 0 é o nível de maior qualidade do codificador LAME. | n, proposta técnica para aprovação |
| Tolerância de duração | A diferença entre durações decodificadas não excede um quadro MP3 na taxa de amostragem do arquivo. | A codificação MP3 trabalha em quadros e pode incluir atraso ou preenchimento. | n, proposta técnica para aprovação |
| Falha por falta de armazenamento | Exibir falha do trabalho e manter o MP3 original quando a capacidade física acabar; não expor saída parcial. | Sem limite de tamanho ou expiração, a capacidade física pode ser esgotada. | n, proposta técnica para aprovação |
| Arquivo inválido | Rejeitar antes de publicar um trabalho quando não há cabeçalho ou quadro MP3 reconhecível; um erro descoberto durante a decodificação marca o trabalho como falho. | Não exige decodificar o arquivo inteiro uma segunda vez para validar a entrada. | n, proposta técnica para aprovação |

**Open questions:** none. As decisões de produto foram registradas em `context.md`; os padrões técnicos acima fazem parte desta proposta de especificação.

## User Stories

### P1: Enviar e inverter MP3 ⭐ MVP

**User Story**: Como visitante, quero enviar um MP3 e baixar o áudio invertido para ouvi-lo do fim para o começo.

**Why P1**: Este é o resultado central do desafio.

**Acceptance Criteria**:

1. WHEN um visitante envia um arquivo com cabeçalho e quadro MP3 reconhecíveis THEN the system SHALL criar um trabalho com identificador único e estado visível `na fila`.
2. WHEN o processamento termina com sucesso THEN the system SHALL gerar um MP3 a partir dos quadros PCM da entrada em ordem temporal inversa, mantendo juntos os canais de cada quadro antes da codificação.
3. WHEN o MP3 invertido é gerado THEN the system SHALL preservar a taxa de amostragem e o número de canais da entrada.
4. WHEN o MP3 invertido é gerado THEN the system SHALL manter a diferença de duração decodificada em no máximo um quadro MP3 na taxa de amostragem da entrada.
5. WHEN um trabalho termina com sucesso THEN the system SHALL oferecer download do MP3 original e do MP3 invertido com tipos de conteúdo e nomes de arquivo identificáveis.
6. The system SHALL decodificar a entrada uma vez e codificar a saída uma vez com LAME VBR qualidade 0, sem outra recodificação com perdas.

**Independent Test**: Enviar um MP3 de teste com sinais distinguíveis no começo e no fim; baixar e decodificar a saída; verificar ordem invertida, duração, canais, taxa de amostragem e os dois downloads.

### P1: Consultar trabalhos públicos

**User Story**: Como visitante, quero acompanhar o trabalho e voltar depois para baixar os arquivos, sem criar uma conta.

**Why P1**: O processamento não tem prazo máximo e a consulta posterior foi escolhida pelo usuário.

**Acceptance Criteria**:

1. WHEN um visitante abre a página THEN the system SHALL mostrar uma lista pública de trabalhos com identificador e estado `na fila`, `processando`, `concluído` ou `falhou`.
2. WHEN não há trabalhos THEN the system SHALL mostrar o estado vazio `Nenhum trabalho enviado` e o controle de envio de MP3.
3. WHEN um visitante recarrega a página ou volta em outra sessão THEN the system SHALL mostrar os trabalhos e os estados persistidos, sem exigir login.
4. WHEN um visitante abre um trabalho concluído na lista THEN the system SHALL mostrar a tela de resultado com player do invertido e os links de download do original e do invertido.
5. The system SHALL manter os trabalhos, os originais válidos e os MP3 invertidos sem expiração ou exclusão automática, inclusive após reinício da aplicação.
6. The system SHALL permitir que qualquer visitante acesse a lista pública e baixe os arquivos de trabalhos concluídos sem login.

**Independent Test**: Enviar um MP3, sair, reiniciar a aplicação e abrir a página em outra sessão; consultar o trabalho e baixar ambos os arquivos.

### P1: Processar arquivos grandes e falhas

**User Story**: Como visitante, quero que arquivos MP3 grandes sejam processados sem esgotar a memória e que uma falha seja indicada de forma clara.

**Why P1**: O usuário proibiu um limite de tamanho e um prazo máximo impostos pela aplicação.

**Acceptance Criteria**:

1. The system SHALL aceitar um MP3 com cabeçalho e quadro reconhecíveis sem rejeitá-lo por um limite de tamanho configurado na aplicação.
2. WHILE um trabalho está `processando` the system SHALL ler, inverter e gravar o áudio em blocos com limite fixo de até 16 MiB de dados de áudio por bloco, sem carregar o arquivo inteiro na memória.
3. The system SHALL executar trabalhos sem prazo máximo de processamento imposto pela aplicação.
4. IF o envio não contém cabeçalho e quadro MP3 reconhecíveis THEN the system SHALL informar `Arquivo MP3 inválido ou não suportado` e não publicar o envio como trabalho.
5. IF o processamento falha após a aceitação do MP3 THEN the system SHALL marcar o trabalho como `falhou`, manter o MP3 original disponível e não oferecer download de um MP3 invertido parcial.
6. IF não há espaço de armazenamento suficiente THEN the system SHALL marcar o trabalho como `falhou` com motivo de falta de espaço e manter qualquer arquivo original já aceito.

**Independent Test**: Processar arquivos de tamanhos crescentes, observar o teto por bloco e a ausência de limite de entrada; enviar dados inválidos; simular falha de processamento e falta de espaço.

### P1: Usar as telas de envio, processamento e resultado

**User Story**: Como visitante, quero escolher o MP3, acompanhar a inversão e ouvir ou baixar o resultado na própria aplicação web.

**Why P1**: O usuário descreveu essas três telas como o fluxo principal da primeira entrega.

**Acceptance Criteria**:

1. WHEN um visitante abre a tela inicial THEN the system SHALL mostrar um botão para escolher um arquivo MP3 e a lista pública de trabalhos.
2. WHEN um visitante usa o botão de escolha THEN the system SHALL abrir o seletor de arquivos do navegador para selecionar um MP3.
3. WHEN um visitante seleciona um arquivo THEN the system SHALL mostrar o nome do arquivo e habilitar o controle `Inverter áudio`.
4. WHEN um visitante aciona `Inverter áudio` com um MP3 aceito THEN the system SHALL mostrar a tela de processamento com ícone de atividade, identificador do trabalho e estado atual.
5. WHILE a tela de processamento está aberta ou fechada THEN the system SHALL continuar o trabalho em segundo plano até `concluído` ou `falhou`, sem depender da conexão da página após o envio.
6. WHEN o trabalho é concluído e o visitante está na tela de processamento THEN the system SHALL mostrar a tela de resultado com um player do MP3 invertido e links de download do original e do invertido.
7. WHEN um visitante aciona `Reproduzir` no player THEN the system SHALL tocar o MP3 invertido do ponto atual.
8. WHEN um visitante aciona `Pausar` no player THEN the system SHALL interromper a reprodução e manter a posição atual.
9. WHEN um visitante altera a posição no player THEN the system SHALL continuar a reprodução do MP3 invertido a partir da posição escolhida.
10. IF o trabalho termina em `falhou` enquanto a tela de processamento está aberta THEN the system SHALL mostrar o motivo da falha e o link para baixar o MP3 original aceito.
11. WHEN um visitante aciona o link `Baixar original` THEN the system SHALL baixar o MP3 original desse trabalho.
12. WHEN um visitante aciona o link `Baixar invertido` THEN the system SHALL baixar o MP3 invertido desse trabalho.

**Independent Test**: Fazer o fluxo completo no navegador, observar as três telas, fechar a página durante o processamento, voltar pela lista pública e testar play, pause, busca e os dois downloads.

### P1: Inspecionar as etapas da arquitetura

**User Story**: Como pessoa responsável pela manutenção, quero localizar cada etapa do processamento em um módulo próprio para inspecioná-la e testá-la separadamente.

**Why P1**: O usuário fixou as caixas do fluxo inicial como fronteiras de módulos da primeira entrega.

**Acceptance Criteria**:

1. The system SHALL entregar interface web e processamento como uma única aplicação e um único projeto executável.
2. The system SHALL ter módulos separados e identificáveis para `Arquivo de áudio`, `Leitura do arquivo`, `Decodificação do áudio`, `Inversão do áudio`, `Codificação do áudio`, `Arquivo de áudio invertido` e `Reprodução`.
3. The system SHALL permitir testar cada um dos sete módulos separadamente por sua interface pública interna, sem executar todo o fluxo web.

**Independent Test**: Inspecionar a estrutura do projeto e executar testes unitários de cada módulo com dados de áudio de referência.

## Architectural Constraints

A primeira entrega é uma aplicação web única. Os sete módulos abaixo correspondem, um a um, às caixas do fluxo apresentado no documento. O desenho técnico definirá interfaces e dependências entre eles.

| Module | Responsibility |
| --- | --- |
| Arquivo de áudio | Receber e registrar o MP3 original. |
| Leitura do arquivo | Ler os dados de entrada de forma limitada em memória. |
| Decodificação do áudio | Produzir quadros PCM a partir do MP3. |
| Inversão do áudio | Reordenar temporalmente os quadros PCM sem separar seus canais. |
| Codificação do áudio | Produzir MP3 a partir dos quadros invertidos. |
| Arquivo de áudio invertido | Publicar, manter e entregar o MP3 gerado. |
| Reprodução | Reproduzir o MP3 invertido no player da tela de resultado. |

## Edge Cases

- Um arquivo com extensão MP3, mas sem quadro MP3 reconhecível, entra no critério de arquivo inválido.
- Um MP3 com corrupção detectada após a aceitação entra no critério de falha de processamento; o original permanece disponível.
- Duas pessoas podem enviar arquivos simultaneamente; cada envio aceito recebe trabalho e estado próprios.
- Uma falha física do armazenamento pode impedir a conclusão, apesar de não haver limite arbitrário de tamanho na aplicação.
- O MP3 original é público quando aceito, inclusive se a inversão falhar.
- A página de processamento pode ser fechada; o trabalho continua e permanece localizável pela lista pública.

## Implicit Requirements

| Dimension | Resolution |
| --- | --- |
| Input validation & bounds | Reconhecer cabeçalho e quadro MP3 antes de aceitar; decodificar durante o processamento; sem limite de tamanho da aplicação; blocos de até 16 MiB. |
| Failure / partial-failure states | Estados `falhou` e erro de entrada; nenhuma saída parcial para download. |
| Idempotency / retry / duplicate handling | Cada envio aceito é um trabalho separado; a interface pode reenviar um arquivo após falha. |
| Auth boundaries & rate limits | Acesso público sem login; sem limite de tamanho. Proteções de infraestrutura contra abuso ficam no desenho técnico, sem alterar os critérios de produto. |
| Concurrency / ordering | Trabalhos simultâneos têm identificadores e estados independentes; ordem de conclusão não é garantida. |
| Data lifecycle / expiry | Original e invertido persistem sem expiração ou exclusão automática. |
| Observability | Estado de cada trabalho e motivo de falha ficam visíveis na lista; logs técnicos serão definidos no desenho. |
| External-dependency failure | Falhas de armazenamento ou codificador levam o trabalho a `falhou`, mantendo o original aceito. |
| State-transition integrity | `na fila` → `processando` → `concluído` ou `falhou`; não expor saída antes de `concluído`. |

## Requirement Traceability

| Requirement ID | Story | Source | Status |
| --- | --- | --- | --- |
| AUD-01 | Enviar e inverter MP3 | F1, F2 | Pending |
| AUD-02 | Enviar e inverter MP3 | F3 | Pending |
| AUD-03 | Enviar e inverter MP3 | N1 | Pending |
| AUD-04 | Enviar e inverter MP3 | F4 | Pending |
| AUD-05 | Enviar e inverter MP3 | F5, F6; decisão do usuário | Pending |
| AUD-06 | Enviar e inverter MP3 | N1 | Pending |
| AUD-07 | Consultar trabalhos públicos | decisão do usuário | Implementing |
| AUD-08 | Consultar trabalhos públicos | decisão do usuário | Pending |
| AUD-09 | Consultar trabalhos públicos | decisão do usuário | Implementing |
| AUD-10 | Consultar trabalhos públicos | decisão do usuário | Pending |
| AUD-11 | Consultar trabalhos públicos | decisão do usuário | Implementing |
| AUD-12 | Consultar trabalhos públicos | decisão do usuário | Pending |
| AUD-13 | Processar arquivos grandes e falhas | N3 | Pending |
| AUD-14 | Processar arquivos grandes e falhas | N2, N6; decisão do usuário | Pending |
| AUD-15 | Processar arquivos grandes e falhas | N5; decisão do usuário | Pending |
| AUD-16 | Processar arquivos grandes e falhas | N4 | Pending |
| AUD-17 | Processar arquivos grandes e falhas | N4 | Pending |
| AUD-18 | Processar arquivos grandes e falhas | restrição física | Pending |
| AUD-19 | Usar as telas de envio, processamento e resultado | decisão do usuário | Pending |
| AUD-20 | Usar as telas de envio, processamento e resultado | decisão do usuário | Pending |
| AUD-21 | Usar as telas de envio, processamento e resultado | decisão do usuário | Pending |
| AUD-22 | Usar as telas de envio, processamento e resultado | decisão do usuário | Pending |
| AUD-23 | Usar as telas de envio, processamento e resultado | decisão do usuário | Pending |
| AUD-24 | Usar as telas de envio, processamento e resultado | decisão do usuário | Pending |
| AUD-25 | Usar as telas de envio, processamento e resultado | decisão do usuário | Pending |
| AUD-26 | Usar as telas de envio, processamento e resultado | decisão do usuário | Pending |
| AUD-27 | Usar as telas de envio, processamento e resultado | decisão do usuário | Pending |
| AUD-28 | Usar as telas de envio, processamento e resultado | decisão do usuário | Pending |
| AUD-29 | Usar as telas de envio, processamento e resultado | decisão do usuário | Pending |
| AUD-30 | Usar as telas de envio, processamento e resultado | decisão do usuário | Pending |
| AUD-31 | Inspecionar as etapas da arquitetura | decisão do usuário | Implementing |
| AUD-32 | Inspecionar as etapas da arquitetura | decisão do usuário | Pending |
| AUD-33 | Inspecionar as etapas da arquitetura | decisão do usuário | Pending |

**Coverage:** 33 critérios, 33 IDs, 0 mapeados a tarefas nesta fase.

## Differences from the source

| Source says | Product decision | Confirmed |
| --- | --- | --- |
| MP3, WAV ou outro formato suportado | Somente MP3 de entrada e saída na primeira entrega | y, usuário em 2026-11-25 |
| Reprodução ou download | Player do invertido e download dos arquivos original e invertido | y, usuário em 2026-11-25 |

## Sources

- `/Users/tiagobani/Downloads/Desafio Técnico - Reprodução de Música ao Contrário.docx`, página 1: problema, requisitos F1–F6 e N1–N6, fluxo inicial de leitura, decodificação, inversão, codificação, arquivo e reprodução.
- `.specs/features/audio-invertido/context.md`: decisões do usuário sobre canal, formatos, downloads, acesso, retenção, tamanho e tempo.
- [Documentação do codificador LAME](https://lame.sourceforge.io/vbr.php): VBR qualidade 0 é o nível de maior qualidade da escala de 0 a 9.

## Success Criteria

- [ ] Um MP3 de referência produz uma saída audivelmente invertida e verificável pelas amostras decodificadas, dentro da tolerância de duração definida.
- [ ] Um visitante baixa original e invertido de um trabalho concluído pela lista pública, mesmo após reinício.
- [ ] Um visitante conclui o fluxo de envio, processamento e resultado, ouve o MP3 invertido no player e baixa ambos os arquivos.
- [ ] Um MP3 grande é processado sem limite de tamanho ou tempo da aplicação e sem carregar o áudio inteiro em memória.
- [ ] As sete caixas do fluxo de áudio são módulos inspecionáveis e testáveis no mesmo projeto web.
