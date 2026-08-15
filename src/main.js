import { createSaveButton } from "./ui/button.js";
import { filenameFor } from "./lib/ids.js";
import { instagram } from "./sites/instagram.js";
import { adslibrary } from "./sites/adslibrary.js";

const ATTACHED = "sp3SaverAttached";
const LOGO = chrome.runtime.getURL("assets/sp3-mark.png");

const site = [instagram, adslibrary].find((s) => s.aplica());
if (!site) throw new Error("[sp3-saver] site nao suportado");

function download(url, type) {
  const filename = filenameFor(url, type);
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "download", url, filename }, (res) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      if (!res?.ok) return reject(new Error(res?.error ?? "download recusado"));
      resolve(res.id);
    });
  });
}

function attach(container) {
  if (container.dataset[ATTACHED]) return;
  container.dataset[ATTACHED] = "1";

  if (getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }

  const ui = createSaveButton({
    logoUrl: LOGO,
    onSave: () => run(false),
    onSaveAll: () => run(true),
  });
  container.append(ui.host);

  container.addEventListener("mouseenter", () => ui.setVisible(true));
  container.addEventListener("mouseleave", () => ui.setVisible(false));

  async function run(all) {
    ui.setState("loading");
    try {
      const { list, index } = await site.resolve(container);
      ui.setCount(index, list.length);

      const targets = all ? list : [list[index] ?? list[0]];
      for (const media of targets) {
        await download(media.url, media.type);
        if (targets.length > 1) await new Promise((r) => setTimeout(r, 350));
      }
      ui.setState("done");
    } catch (err) {
      console.warn("[sp3-saver]", err);
      ui.setState("error", err.message);
    }
  }

  // primeira leitura do contador, sem baixar nada
  Promise.resolve()
    .then(() => site.resolve(container))
    .then(({ list, index }) => ui.setCount(index, list.length))
    .catch(() => {});
}

function scan() {
  for (const container of site.containers()) attach(container);
}

const observer = new MutationObserver(() => scan());
observer.observe(document.body, { childList: true, subtree: true });
scan();
