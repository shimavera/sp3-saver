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
  resolveAuto({ permalink: permalinkOf(container), visibleUrls: visibleUrlsOf(container) })
    .then(({ list, index }) => ui.setCount(index, list.length))
    .catch(() => {});
}

function scan() {
  for (const article of document.querySelectorAll("article")) attach(article);
}

const observer = new MutationObserver(() => scan());
observer.observe(document.body, { childList: true, subtree: true });
scan();
