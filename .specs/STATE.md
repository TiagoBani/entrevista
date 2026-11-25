# STATE

## Decisions

### AD-001
- **Decision**: A aplicação web será um único projeto Node.js 24, com SQLite integrado para o estado persistente e sete módulos separados para as caixas do fluxo de áudio.
- **Reason**: O usuário escolheu Node.js 24 e pediu uma aplicação única cujas etapas possam ser inspecionadas separadamente.
- **Trade-off**: O projeto depende de Node.js 24 e do módulo `node:sqlite`, ainda em estágio release candidate nessa versão; o processamento usa FFmpeg como dependência externa.
- **Scope**: Primeira entrega da reprodução de áudio invertido e estrutura base do projeto.
- **Date**: 2026-11-25
- **Status**: active

## Handoff
