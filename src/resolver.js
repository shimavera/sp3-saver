import { shortcodeToId, shortcodeFromUrl } from "./lib/ids.js";
import { collectMedia, matchIndexByUrl } from "./lib/media.js";

export const IG_APP_ID = "936619743392459";

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

export function resolveFromDom(visibleUrls) {
  const url = visibleUrls.find((u) => /\.(jpe?g|png|webp)/i.test(u));
  if (!url) throw new Error("nao consegui achar o arquivo original");
  return { list: [{ type: "image", url }], index: 0 };
}

export async function resolveAuto({ permalink, reelId, visibleUrls }) {
  try {
    if (reelId) return await resolveStory(reelId, visibleUrls);
    if (permalink) return await resolvePost(permalink, visibleUrls);
  } catch (err) {
    console.warn("[ig-saver] camada 1 falhou:", err.message);
  }
  return resolveFromDom(visibleUrls);
}
