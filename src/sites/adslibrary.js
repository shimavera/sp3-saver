// Biblioteca de Anuncios do Meta.
//
// Diferente do Instagram, aqui o <video> traz o arquivo direto no src (nada de
// streaming), entao a leitura da propria pagina basta — sem endpoint, sem
// sessao logada.

const LARGURA_MINIMA = 200;

function ehArquivoDireto(url) {
  return typeof url === "string" && url.startsWith("http");
}

function containerDe(elemento) {
  // sobe ate um bloco que sirva de ancora para o botao, sem sair do card
  let alvo = elemento.parentElement;
  for (let i = 0; i < 3 && alvo; i++) {
    if (getComputedStyle(alvo).position !== "static") return alvo;
    alvo = alvo.parentElement;
  }
  return elemento.parentElement;
}

export const adslibrary = {
  nome: "biblioteca de anuncios",

  aplica: () =>
    location.hostname.endsWith("facebook.com") && location.pathname.startsWith("/ads/library"),

  containers() {
    const encontrados = new Set();

    for (const video of document.querySelectorAll("video")) {
      const container = containerDe(video);
      if (container) encontrados.add(container);
    }

    for (const img of document.querySelectorAll("img")) {
      if (img.naturalWidth < LARGURA_MINIMA) continue;
      if (!/fbcdn|cdninstagram/.test(img.currentSrc || img.src)) continue;
      const container = containerDe(img);
      if (container) encontrados.add(container);
    }

    return [...encontrados];
  },

  async resolve(container) {
    const video = container.querySelector("video");
    const urlVideo = video?.currentSrc || video?.src;
    if (video && ehArquivoDireto(urlVideo)) {
      return { list: [{ type: "video", url: urlVideo }], index: 0 };
    }
    if (video) throw new Error("o video ainda nao carregou, roda ele e tenta de novo");

    const img = [...container.querySelectorAll("img")]
      .filter((i) => i.naturalWidth >= LARGURA_MINIMA)
      .sort((a, b) => b.naturalWidth - a.naturalWidth)[0];

    const urlImagem = img?.currentSrc || img?.src;
    if (ehArquivoDireto(urlImagem)) {
      return { list: [{ type: "image", url: urlImagem }], index: 0 };
    }

    throw new Error("nao achei o criativo desse anuncio");
  },
};
