# Reprodução de áudio invertido — descoberta

**Estado:** requisitos de origem e decisões de produto levantados; especificação TLC aprovada em 2026-11-25 e desenho proposto para aprovação.
**Fonte:** `/Users/tiagobani/Downloads/Desafio Técnico - Reprodução de Música ao Contrário.docx`, página 1, recebido em 2026-11-25.

## Problema e resultado esperado

Uma pessoa fornece um arquivo de áudio e recebe outro arquivo cuja reprodução começa no fim da gravação original e termina no início. A inversão deve ocorrer no conteúdo sonoro, não na ordem de músicas ou em metadados.

## Requisitos explícitos da fonte

| ID de origem | Requisito |
| --- | --- |
| F1 | Receber um arquivo de áudio, citando MP3 e WAV como exemplos. |
| F2 | Ler e processar o conteúdo do arquivo. |
| F3 | Inverter a ordem de reprodução dos dados de áudio. |
| F4 | Preservar a duração original. |
| F5 | Gerar um novo arquivo com o áudio invertido. |
| F6 | Permitir reprodução ou download do arquivo gerado. |
| N1 | Preservar ao máximo a qualidade original. |
| N2 | Evitar consumo desnecessário de memória. |
| N3 | Suportar arquivos grandes. |
| N4 | Tratar formatos inválidos ou não suportados. |
| N5 | Manter tempo de processamento razoável. |
| N6 | Evitar carregar o arquivo inteiro na memória quando não for necessário. |

## Fluxo inicial indicado pela fonte

```mermaid
flowchart LR
  A[Arquivo de áudio] --> B[Leitura do arquivo]
  B --> C[Decodificação]
  C --> D[Inversão do áudio a definir]
  D --> E[Codificação]
  E --> F[Arquivo de áudio invertido]
  F --> G[Reprodução]
```

A figura é uma proposta inicial de componentes; o documento pede que a implementação das partes em aberto seja proposta pela equipe. Ela não especifica tecnologia, interface ou algoritmo.

## Decisões pendentes com o negócio

Nenhuma para o escopo da primeira entrega. Critérios aprovados na especificação; desenho técnico em revisão.

## Decisão confirmada pelo usuário

- **Tamanho e duração do processamento (2026-11-25):** não impor limite de tamanho ao arquivo de entrada nem prazo máximo de processamento. O objetivo é concluir o processamento mesmo que demore. A implementação deve processar dados em blocos de tamanho limitado, sem manter o áudio inteiro na memória. O tamanho concreto dos blocos é uma decisão técnica da fase de desenho. A capacidade física de armazenamento continua sendo uma restrição do ambiente, não um limite arbitrário da aplicação.
- **Formato e entrega (2026-11-25):** aceitar MP3 como entrada, gerar MP3 como saída e permitir o download do arquivo invertido. WAV e outros formatos não fazem parte da primeira entrega.
- **Acesso e retenção (2026-11-25):** não exigir login; permitir voltar para acompanhar um processamento longo; não aplicar expiração automática aos arquivos.
- **Canal e acesso público (2026-11-25):** primeira entrega somente em página web, sem ferramenta de linha de comando e sem login. Uma lista pública permite consultar os trabalhos e baixar os arquivos.
- **Retenção e download (2026-11-25):** guardar sem expiração automática tanto o MP3 original quanto o invertido; permitir o download de ambos pela lista pública.
- **Arquitetura e telas (2026-11-25):** entregar uma aplicação web única, sem projetos separados para frontend e backend. Cada caixa do fluxo inicial é um módulo próprio e inspecionável. O fluxo visível tem tela de envio com botão para arquivo, tela de processamento em segundo plano com ícone de atividade e tela de resultado com player do invertido e links para baixar original e invertido.

## Pontos que a especificação deverá tornar verificáveis

- A inversão deve preservar a associação entre os canais de cada quadro de áudio; inverter bytes de um arquivo comprimido não satisfaz F3.
- A tolerância de duração precisa considerar amostragem e possíveis diferenças de codificador.
- Qualidade precisa de uma política de saída e de um critério observável.
- Falha de formato, arquivo corrompido e interrupção de processamento devem ter resultados definidos.
- O uso de memória deve continuar limitado à medida que o tamanho do arquivo aumenta, com limite definido por bloco, conforme decisão do usuário.

## Estado do repositório

O repositório contém README e skills, sem aplicação, testes ou linguagem de implementação definidos. Não há convenção de produto existente que resolva as decisões acima.
