import { createSaveButton } from "./ui/button.js";
import { resolveAuto } from "./resolver.js";
import { filenameFromUrl } from "./lib/ids.js";

const ATTACHED = "igSaverAttached";

function download(url) {
  const filename = filenameFromUrl(url) ?? `instagram_${Date.now()}.jpg`;
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "download", url, filename }, (res) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      if (!res?.ok) return reject(new Error(res?.error ?? "download recusado"));
      resolve(res.id);
    });
  });
}

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

function attach(container) {
  if (container.dataset[ATTACHED]) return;
  container.dataset[ATTACHED] = "1";

  if (getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }

  const ui = createSaveButton({
    onSave: () => run(false),
    onSaveAll: () => run(true),
  });
  container.append(ui.host);

  container.addEventListener("mouseenter", () => ui.setVisible(true));
  container.addEventListener("mouseleave", () => ui.setVisible(false));

  async function run(all) {
    ui.setState("loading");
    try {
      const { list, index } = await resolveAuto({
        permalink: permalinkOf(container),
        reelId: reelIdFromPage(),
        visibleUrls: visibleUrlsOf(container),
      });
      ui.setCount(index, list.length);

      const targets = all ? list : [list[index] ?? list[0]];
      for (const media of targets) {
        await download(media.url);
        if (targets.length > 1) await new Promise((r) => setTimeout(r, 350));
      }
      ui.setState("done");
    } catch (err) {
      console.warn("[ig-saver]", err);
      ui.setState("error", err.message);
    }
  }

  // primeira leitura do contador, sem baixar nada
  resolveAuto({
    permalink: permalinkOf(container),
    reelId: reelIdFromPage(),
    visibleUrls: visibleUrlsOf(container),
  })
    .then(({ list, index }) => ui.setCount(index, list.length))
    .catch(() => {});
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

function scan() {
  for (const el of document.querySelectorAll("article")) attach(el);
  for (const el of storyContainers()) attach(el);
  for (const el of avatarContainers()) attach(el);
}

const observer = new MutationObserver(() => scan());
observer.observe(document.body, { childList: true, subtree: true });
scan();
