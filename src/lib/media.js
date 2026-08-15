import { filenameFromUrl } from "./ids.js";

function widest(candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  return candidates.reduce((best, c) => ((c?.width ?? 0) > (best?.width ?? 0) ? c : best));
}

function pickOne(node) {
  const video = widest(node?.video_versions);
  if (video?.url) return { type: "video", url: video.url };

  const image = widest(node?.image_versions2?.candidates);
  if (image?.url) return { type: "image", url: image.url };

  return null;
}

export function collectMedia(item) {
  const nodes = Array.isArray(item?.carousel_media) ? item.carousel_media : [item];
  const media = nodes.map(pickOne).filter(Boolean);
  if (media.length === 0) throw new Error("resposta sem midia utilizavel");
  return media;
}

export function matchIndexByUrl(visibleUrls, list) {
  const visible = new Set(visibleUrls.map(filenameFromUrl).filter(Boolean));
  const index = list.findIndex((m) => visible.has(filenameFromUrl(m.url)));
  return index === -1 ? 0 : index;
}
