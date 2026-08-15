# SP3 Saver — Design

Data: 2026-08-15
Status: aprovado pelo Juan

> **v0.2 (mesmo dia):** o projeto passou a se chamar SP3 Saver, ganhou o
> símbolo da SP3 no botão e suporte à Biblioteca de Anúncios do Meta
> (`facebook.com/ads/library`), onde um clique baixa o criativo visível.
> Lá o `<video>` traz o arquivo direto no `src`, então não há endpoint
> envolvido — a leitura da página basta. O resto do desenho abaixo
> permanece válido.

## Objetivo

Extensão de Chrome, de uso pessoal, que baixa mídia do Instagram com um clique
a partir da própria página, usando a sessão já logada do navegador.

Não há backend, não há API oficial, não há login próprio. Tudo roda no cliente.

## Escopo

**Dentro (v1):**

- Post de foto e post de vídeo/reel
- Carrossel — slide visível por padrão, com ação separada para baixar todos
- Story aberto no viewer (foto e vídeo), sem marcar como visualizado
- Foto de perfil em alta resolução e mídias de destaques

**Fora (v1):**

- Publicação na Chrome Web Store (instalação descompactada, modo desenvolvedor)
- Download em lote de perfil inteiro
- Renomeação, organização em pastas, metadados, legenda
- Qualquer envio de dados para fora da máquina

## Decisões do usuário

| Assunto | Decisão |
|---|---|
| Gatilho | Botão flutuante sobre a mídia, no canto superior direito |
| Destino | Pasta padrão de Downloads, sem subpasta |
| Nome do arquivo | Nome original do CDN, sem renomear |
| Carrossel | Clique = slide visível; ação secundária = todos os slides |

## Arquitetura

Manifest V3, três módulos:

```
content.js   → detecta mídia na página, injeta UI, orquestra
resolver.js  → descobre a URL real do arquivo
background.js→ service worker; chama chrome.downloads.download
```

Comunicação content → background por `chrome.runtime.sendMessage` com
`{ type: "download", url, filename }`. O background responde sucesso ou erro,
e o content reflete isso no botão.

### Permissões

- `downloads` — gravar o arquivo
- `host_permissions`: `https://www.instagram.com/*`, `https://*.cdninstagram.com/*`,
  `https://*.fbcdn.net/*`

Nada além disso. Sem `tabs`, sem `storage` remoto, sem analytics.

## Resolução da mídia (núcleo do projeto)

O elemento `<video>` do Instagram usa streaming, então seu `src` é um endereço
`blob:` válido só dentro daquela aba. Não serve para download. Imagem em
`<img srcset>` funciona, mas nem sempre traz a maior resolução e não cobre
carrossel fora da tela.

Solução em camadas, na ordem:

1. **Endpoint de mídia do próprio Instagram.** O content script faz `fetch`
   autenticado (cookies da sessão, header `x-ig-app-id` que o site já usa)
   para os dados brutos daquele item. Retorna a lista completa de versões:
   vídeo em máxima qualidade, todas as imagens do carrossel, story, destaque.
2. **Leitura do DOM.** Para foto, cai no maior candidato do `srcset`.
3. **Erro visível.** Botão fica vermelho, tooltip diz o que falhou. Nunca
   falha em silêncio.

Identificação do item vem do shortcode presente na URL/link do post
(`/p/{shortcode}/`, `/reel/{shortcode}/`); a conversão shortcode → id é local,
sem rede. Story e destaque são resolvidos pelo id do autor no viewer aberto.

### Story sem marcar como visto

A extensão apenas **lê** os dados. Nunca chama o endpoint que registra
visualização. Abrir o story já marca visto pelo próprio Instagram — a extensão
não piora nem melhora isso, só não contribui.

### Nome do arquivo

Extraído do `pathname` da URL do CDN, removendo query string e sanitizando
caracteres inválidos. Ex.: `.../473738383_1122334455_n.mp4?ig_cache=...`
vira `473738383_1122334455_n.mp4`.

## Interface

Botão redondo, injetado em **Shadow DOM** para que nenhum CSS vaze em nenhuma
direção. Aparece no hover sobre a mídia, canto superior direito, mesma pegada
visual da referência do usuário (ícone flutuante + ação de salvar).

Estados:

| Estado | Aparência |
|---|---|
| Ocioso | Ícone de download, fundo translúcido |
| Baixando | Spinner |
| Sucesso | Check verde por ~1,5s, volta a ocioso |
| Erro | Vermelho, tooltip com o motivo |

Carrossel: badge com posição (`3/7`) e botão secundário "todos" ao lado, que
dispara os N arquivos em sequência com pequeno intervalo entre eles.

Detecção de mídia nova (scroll infinito, troca de story) via `MutationObserver`
com deduplicação por elemento já processado.

## Tratamento de erro

- Falha de rede no resolver → tenta camada seguinte
- Todas as camadas falharam → botão vermelho + motivo
- `chrome.downloads` recusou → mesmo tratamento, motivo propagado do background
- Nenhum erro derruba a página nem o observer; cada botão falha isolado

## Testes

Automatizado, só a lógica pura (sem DOM, sem rede):

- conversão shortcode → id
- extração e sanitização do nome do arquivo a partir da URL do CDN
- seleção da melhor versão dentro da resposta de mídia

Manual, obrigatório antes de considerar pronto — os 6 casos:
post foto, post vídeo/reel, carrossel (slide e "todos"), story foto,
story vídeo, avatar e destaque.

## Riscos assumidos

- O Instagram muda DOM e endpoints com frequência; manutenção pontual é
  esperada. O desenho em camadas existe para que a quebra seja parcial e
  visível, não total e silenciosa.
- Extensões de download do Instagram costumam ser rejeitadas na Chrome Web
  Store. Por isso a distribuição é descompactada, uso pessoal.
- Baixar conteúdo de terceiros para republicação tem implicação de direito
  autoral. Uso previsto: referência e estudo.
