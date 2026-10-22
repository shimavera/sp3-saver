import { normalizeVideoUrl, resolveAuto } from "../resolver.js";

function visibleUrlsOf(container) {
  const urls = [];
  for (const img of container.querySelectorAll("img")) {
    if (img.currentSrc || img.src) urls.push(img.currentSrc || img.src);
  }
  for (const video of container.querySelectorAll("video")) {
    // O poster e uma imagem de preview, nao o arquivo do video. Usa somente
    // uma URL HTTP direta; `blob:` pertence ao player e nao pode ser baixada.
    const url = video.currentSrc || video.src;
    if (url?.startsWith("http")) urls.push(url);
  }
  return urls;
}

function loadedVideoUrls() {
  const candidates = new Map();
  for (const entry of performance.getEntriesByType("resource")) {
    try {
      const url = new URL(entry.name);
      if (!/\.mp4$/i.test(url.pathname)) continue;
      if (!/(^|\.)(cdninstagram\.com|fbcdn\.net)$/i.test(url.hostname)) continue;

      // O player carrega o áudio em um arquivo MP4 separado. Ele não é o vídeo.
      const encoded = url.searchParams.get("efg") ?? "";
      let metadata = "";
      try {
        const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
        metadata = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
      } catch {}
      // DASH separa vídeo e áudio. Baixar só o MP4 observado gera arquivo
      // sem som e, em alguns casos, com codec VP9 incompatível com QuickTime.
      if (/audio|dash[_-]/i.test(metadata)) continue;

      // O player solicita partes do MP4. Sem esses parâmetros, a URL assinada
      // aponta para o arquivo completo, em vez de somente um trecho do vídeo.
      const videoUrl = normalizeVideoUrl(url.href);
      if (videoUrl) candidates.set(videoUrl, entry.startTime ?? 0);
    } catch {}
  }
  return [...candidates]
    .sort((a, b) => b[1] - a[1])
    .map(([url]) => url);
}

function permalinkOf(container) {
  const link = container.querySelector('a[href*="/p/"], a[href*="/reel/"]');
  if (link) return link.href;
  return /\/(p|reel|reels|tv)\//.test(location.pathname) ? location.href : null;
}

function pageJsonTexts() {
  return [...document.querySelectorAll('script[type="application/json"]')]
    .map((script) => script.textContent)
    .filter((text) => text?.includes("video_versions"));
}

function reelIdFromPage() {
  if (!location.pathname.startsWith("/stories/")) return null;

  // o id do autor aparece no estado que a própria página já carregou
  const html = document.documentElement.innerHTML;
  const owner = html.match(/"owner":\{"[^}]*?"id":"(\d+)"/);
  if (owner) return owner[1];

  const profile = html.match(/"profile_id":"(\d+)"/) ?? html.match(/"user_id":"(\d+)"/);
  return profile ? profile[1] : null;
}

function storyContainers() {
  if (!location.pathname.startsWith("/stories/")) return [];
  const media = document.querySelector("section video, section img[srcset]");
  const container = media?.closest("section");
  return container ? [container] : [];
}

// A pagina dedicada de reel (/reels/<code>/ e /reel/<code>/) NAO usa <article>:
// o player fica solto numa arvore de <div>. Sem este fallback nenhum container
// e encontrado ali e o botao simplesmente nunca aparece.
const MIN_LADO = 240;

function grande(el) {
  const r = el.getBoundingClientRect();
  return r.width >= MIN_LADO && r.height >= MIN_LADO;
}

// Sobe do <video>/<img> ate o wrapper do player, parando antes de engolir
// a pagina inteira — o botao e posicionado em relacao a esse no.
function wrapperDe(el) {
  const base = el.getBoundingClientRect();
  const area = base.width * base.height;
  let node = el;
  while (node.parentElement && node.parentElement !== document.body) {
    const pai = node.parentElement.getBoundingClientRect();
    if (pai.width * pai.height > area * 1.8) break;
    node = node.parentElement;
  }
  return node === el ? el.parentElement ?? el : node;
}

function mediaContainers() {
  if (location.pathname.startsWith("/stories/")) return [];

  const vistos = new Set();
  const containers = [];
  for (const el of document.querySelectorAll("video, img")) {
    if (!grande(el) || el.closest("article") || el.closest("header")) continue;
    const host = wrapperDe(el);
    if (vistos.has(host)) continue;
    vistos.add(host);
    containers.push(host);
  }
  return containers;
}

function avatarContainers() {
  const header = document.querySelector("header");
  const avatar = header?.querySelector(
    'img[alt*="foto do perfil" i], img[alt*="profile picture" i]'
  );
  const container = avatar?.closest("header > div, span");
  return container ? [container] : [];
}

export const instagram = {
  nome: "instagram",

  aplica: () => location.hostname.endsWith("instagram.com"),

  containers() {
    return [
      ...document.querySelectorAll("article"),
      ...storyContainers(),
      ...avatarContainers(),
      ...mediaContainers(),
    ];
  },

  resolve(container) {
    const permalink = permalinkOf(container);
    return resolveAuto({
      permalink,
      reelId: reelIdFromPage(),
      visibleUrls: visibleUrlsOf(container),
      loadedVideoUrls: loadedVideoUrls(),
      pageJsonTexts: permalink ? pageJsonTexts() : [],
      hasVideo: !!container.querySelector("video"),
    });
  },
};
