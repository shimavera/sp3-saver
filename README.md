<img src="assets/icon128.png" width="64" alt="SP3">

# SP3 Saver

Extensão de Chrome que baixa mídia com um clique, direto da página:

- **Instagram** — foto, vídeo/reel, carrossel, story, destaque e foto de perfil
- **Biblioteca de Anúncios do Meta** — o criativo de cada anúncio

Um botão flutuante aparece sobre a mídia quando você passa o mouse. Clicou,
baixou, com o nome original do arquivo, direto na sua pasta de Downloads.

## Instalar

1. Baixe o projeto: **Code → Download ZIP** aqui no GitHub, e descompacte
   (ou `git clone` se você usa git)
2. Abra `chrome://extensions`
3. Ligue **Modo do desenvolvedor**, no canto superior direito
4. Clique em **Carregar sem compactação** e escolha a pasta do projeto
5. Abra o instagram.com ou a Biblioteca de Anúncios e passe o mouse sobre a mídia

Não está na Chrome Web Store de propósito: extensão de download do Instagram
costuma ser rejeitada por lá. A instalação descompactada funciona igual.

## Como funciona

O vídeo do Instagram não pode ser baixado direto da tela — o player usa
streaming e o endereço que aparece no `<video>` só vale dentro daquela aba.
Então a extensão pergunta ao próprio Instagram, com a sua sessão já logada,
quais são os arquivos originais daquela publicação.

Na Biblioteca de Anúncios é mais simples: o Meta serve o vídeo do anúncio
direto, e a extensão lê o endereço na própria página.

Story: a extensão só lê. Ela nunca dispara o evento de "visualizado" — você
não aparece na lista de quem viu por causa dela.

## Testes

```bash
npm test
```

Cobrem a lógica pura (`src/lib/`). O comportamento na página é validado
manualmente — veja `docs/teste-manual.md`.

## Quando parar de funcionar

Instagram e Meta mudam a estrutura das páginas com frequência. O resolver
tenta, nesta ordem: endpoint interno → leitura da página → erro visível no
botão. Ele nunca falha em silêncio.

- Botão vermelho em tudo: o endpoint mudou. Conferir no console da página o
  status de `/api/v1/media/<id>/info/`.
- Botão não aparece: a detecção de container mudou. Ajustar `containers()` em
  `src/sites/instagram.js` ou `src/sites/adslibrary.js`.

## Escopo e limites

Uso pessoal e de referência. Baixar conteúdo de terceiros para republicar tem
implicação de direito autoral — a responsabilidade é de quem usa.
