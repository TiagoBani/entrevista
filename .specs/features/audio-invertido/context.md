# Reprodução de áudio invertido — contexto

**Gathered:** 2026-11-25
**Spec:** `.specs/features/audio-invertido/spec.md` (aprovada em 2026-11-25)
**Status:** Decisões registradas na especificação aprovada

## Feature Boundary

Receber um MP3 em uma página web, inverter o conteúdo sonoro e disponibilizar os arquivos original e invertido para download em uma lista pública.

## Implementation Decisions

### Arquivos grandes e memória

- Usuário: "não teremos limite do arquivo, o objetivo é que ele processe mesmo que demore".
- Usuário: "o limite deve ser apenas para cada chunk de dados a ser processado para nao ter limite de memoria".
- Critério de produto: a aplicação não deve rejeitar um arquivo com base apenas em seu tamanho nem impor prazo máximo de processamento. O tamanho de cada bloco de processamento deve ser limitado; a escolha numérica do bloco cabe ao desenho técnico.

### Formato e entrega

- Usuário: "usaremos apenas mp3 para entrega e saida/ aceita o download".
- A primeira entrega deve aceitar MP3, gerar MP3 invertido e permitir download.

### Acesso e retenção

- Usuário: "não teremos ususario para a primeira entrega ou seja sem login".
- Usuário: "sim, não teremos expiração".
- Usuário: "Sim, somente página web sem login (recomendado)".
- Usuário: "Por uma lista pública de trabalhos".
- Usuário: "Guardar original e MP3 invertido sem expiração".
- Usuário: "Sim; permitir baixar original e invertido".
- A primeira entrega é somente web. A lista pública permite voltar ao trabalho e baixar tanto o MP3 original quanto o invertido, sem expiração automática.

### Arquitetura e telas

- Usuário: "não precisamos separar em frontend e backend porem cada caixa precisa que seja um modulo separado para inspeção posterior".
- O projeto web será uma aplicação única. Cada caixa do fluxo do documento terá um módulo separado: entrada do arquivo, leitura, decodificação, inversão, codificação, arquivo invertido e reprodução.
- Usuário: "uma tela com um botao para escolher o arquivo de audio".
- Usuário: "uma outra de loading com icone de processamento onde em background ira realizar as fases de leitura, até o arquivo invertido".
- Usuário: "uma tela com o resultado com o arquivo invertido com link para download, um link para o arquivo original e um player para reprodução".
- O fluxo visível terá telas de envio, processamento e resultado. A tela de resultado reproduz o invertido e oferece os dois downloads.
- Usuário: "vamos separa-lo em chunks de 16mb, e ao final iremos juntar tudo".
- O desenho usa blocos PCM de até 16 MiB, em ordem inversa e com os quadros de cada bloco também invertidos. Os blocos entram em uma única codificação MP3 contínua, que publica um arquivo só ao final.

## Pending Product Decisions

Nenhuma para o escopo da primeira entrega. A especificação foi aprovada; a escolha da base técnica está em andamento no desenho.
