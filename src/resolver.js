import { shortcodeToId, shortcodeFromUrl } from "./lib/ids.js";
import { collectMedia, matchIndexByUrl } from "./lib/media.js";

export const IG_APP_ID = "936619743392459";

export function normalizeVideoUrl(url) {
  try {
    const parsed = new URL(url);
    if (!/\.mp4$/i.test(parsed.pathname)) return null;
    parsed.searchParams.delete("bytestart");
    parsed.searchParams.delete("byteend");
    return parsed.href;
  } catch {
    return null;
  }
}

function isStandaloneVideoUrl(url) {
  const normalized = normalizeVideoUrl(url);
  if (!normalized) return null;
  try {
    const efg = new URL(url).searchParams.get("efg");
    if (efg) {
      const base64 = efg.replace(/-/g, "+").replace(/_/g, "/");
      const metadata = JSON.parse(atob(base64 + "=".repeat((4 - base64.length % 4) % 4)));
      if (/audio|dash[_-]/i.test(metadata?.vencode_tag ?? "")) return null;
    }
  } catch {
    // URL sem metadados de codec continua candidata; a origem direta é testada acima.
  }
  return normalized;
}

export function resolveFromPageData(permalink, visibleUrls, jsonTexts = []) {
  const shortcode = shortcodeFromUrl(permalink);
  if (!shortcode) return null;

  for (const text of jsonTexts) {
    if (!text?.includes(shortcode) || !text.includes("video_versions")) continue;
    let root;
    try {
      root = JSON.parse(text);
    } catch {
      continue;
    }

    const stack = [root];
    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== "object") continue;
      if ((node.code === shortcode || node.shortcode === shortcode) &&
          (node.video_versions?.length || node.image_versions2 || node.carousel_media)) {
        const list = collectMedia(node);
        return { list, index: matchIndexByUrl(visibleUrls, list) };
      }
      stack.push(...Object.values(node));
    }
  }
  return null;
}

async function apiJson(path) {
  const res = await fetch(`https://www.instagram.com${path}`, {
    credentials: "include",
    headers: { "x-ig-app-id": IG_APP_ID },
  });
  if (!res.ok) throw new Error(`Instagram respondeu ${res.status}`);
  return res.json();
}

export async function resolvePost(permalink, visibleUrls) {
  const shortcode = shortcodeFromUrl(permalink);
  if (!shortcode) throw new Error("nao encontrei o codigo do post");

  const id = shortcodeToId(shortcode);
  const json = await apiJson(`/api/v1/media/${id}/info/`);
  const item = json?.items?.[0];
  if (!item) throw new Error("resposta sem o post");

  const list = collectMedia(item);
  return { list, index: matchIndexByUrl(visibleUrls, list) };
}

export async function resolveStory(reelId, visibleUrls) {
  const json = await apiJson(
    `/api/v1/feed/reels_media/?reel_ids=${encodeURIComponent(reelId)}`
  );
  const reel = json?.reels_media?.[0] ?? json?.reels?.[reelId];
  const items = reel?.items ?? [];
  if (items.length === 0) throw new Error("nenhum story disponivel");

  const list = items.map((item) => collectMedia(item)[0]);
  return { list, index: matchIndexByUrl(visibleUrls, list) };
}

export function resolveFromDom(visibleUrls, loadedVideoUrls = [], hasVideo = false) {
  const video = [...visibleUrls, ...loadedVideoUrls].map(isStandaloneVideoUrl).find(Boolean);
  if (video) return { list: [{ type: "video", url: video }], index: 0 };

  if (hasVideo) throw new Error("nao achei video completo com audio para baixar");

  const url = visibleUrls.find((u) => /\.(jpe?g|png|webp)/i.test(u));
  if (!url) throw new Error("nao consegui achar o arquivo original");
  return { list: [{ type: "image", url }], index: 0 };
}

export async function resolveAuto({ permalink, reelId, visibleUrls, loadedVideoUrls = [], pageJsonTexts = [], hasVideo = false }) {
  const pageMedia = resolveFromPageData(permalink, visibleUrls, pageJsonTexts);
  if (pageMedia) return pageMedia;

  try {
    if (reelId) return await resolveStory(reelId, visibleUrls);
    if (permalink) return await resolvePost(permalink, visibleUrls);
  } catch (err) {
    console.warn("[ig-saver] camada 1 falhou:", err.message);
  }
  return resolveFromDom(visibleUrls, loadedVideoUrls, hasVideo);
}
