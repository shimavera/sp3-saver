import { resolveAuto } from "../resolver.js";

function visibleUrlsOf(container) {
  const urls = [];
  for (const img of container.querySelectorAll("img")) {
    if (img.currentSrc || img.src) urls.push(img.currentSrc || img.src);
  }
  for (const video of container.querySelectorAll("video")) {
    if (video.poster) urls.push(video.poster);
  }
  return urls;
}

function permalinkOf(container) {
  const link = container.querySelector('a[href*="/p/"], a[href*="/reel/"]');
  if (link) return link.href;
  return /\/(p|reel|reels|tv)\//.test(location.pathname) ? location.href : null;
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
    return [...document.querySelectorAll("article"), ...storyContainers(), ...avatarContainers()];
  },

  resolve(container) {
    return resolveAuto({
      permalink: permalinkOf(container),
      reelId: reelIdFromPage(),
      visibleUrls: visibleUrlsOf(container),
    });
  },
};
