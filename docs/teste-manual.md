# Roteiro de teste manual

Rodar depois de qualquer mudança no content script ou no resolver.
Recarregar a extensão em `chrome://extensions` e depois atualizar a aba do
Instagram antes de começar. Uma aba já aberta mantém o content script antigo.

| # | Caso | Passo | Esperado |
|---|---|---|---|
| 1 | Post de foto | Abrir post, passar o mouse, clicar | `.jpg` no Downloads, nome do CDN |
| 2 | Reel / vídeo | Abrir reel, clicar | `.mp4` no Downloads; `ffprobe` mostra H.264 e áudio AAC quando disponível; QuickTime abre o arquivo |
| 3 | Carrossel — slide | Ir para o slide 3, clicar | badge mostra `3/N`, baixa só o slide 3 |
| 4 | Carrossel — todos | Clicar em "todos" | N arquivos, um por slide |
| 5 | Story foto | Abrir story de foto, clicar | imagem no Downloads |
| 6 | Story vídeo | Abrir story de vídeo, clicar | `.mp4` no Downloads |
| 7 | Destaque | Abrir destaque, clicar | mídia no Downloads |
| 8 | Avatar | Passar o mouse na foto de perfil, clicar | imagem do avatar no Downloads |
| 9 | Erro visível | Desligar a rede e clicar | botão fica vermelho, tooltip com o motivo |
| 10 | Anúncio em vídeo | Abrir a Biblioteca de Anúncios, clicar num card | `.mp4` do criativo no Downloads |
| 11 | Anúncio em imagem | Card de anúncio com foto, clicar | imagem do criativo no Downloads |
| 12 | Logo SP3 | Passar o mouse em qualquer mídia | símbolo azul da SP3 ao lado dos botões |

## Conferir que o endpoint ainda responde

Com o instagram.com aberto e logado, no console da página:

```js
const r = await fetch("https://www.instagram.com/api/v1/media/3174929931019554034/info/", {
  credentials: "include",
  headers: { "x-ig-app-id": "936619743392459" },
});
console.log(r.status);
```

`200` = camada 1 saudável. Se o endpoint devolver HTML ou falhar, a extensão
procura a versão progressiva em `video_versions` nos dados da própria página,
conferindo o shortcode do post. Um MP4 DASH carregado pelo player pode conter
somente VP9 sem áudio e não serve como arquivo final. URLs de áudio, `blob:` e
posters não são tratados como vídeo. Sem arquivo completo disponível, o botão
mostra erro em vez de salvar mídia incompatível ou a imagem de capa.
