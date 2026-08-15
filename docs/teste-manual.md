# Roteiro de teste manual

Rodar depois de qualquer mudança no content script ou no resolver.
Recarregar a extensão em `chrome://extensions` antes de começar.

| # | Caso | Passo | Esperado |
|---|---|---|---|
| 1 | Post de foto | Abrir post, passar o mouse, clicar | `.jpg` no Downloads, nome do CDN |
| 2 | Reel / vídeo | Abrir reel, clicar | `.mp4` no Downloads |
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

`200` = camada 1 saudável. `401`/`403` = a extensão vai cair no plano B do DOM
(só foto) e mostrar erro em vídeo.
