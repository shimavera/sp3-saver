const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export function shortcodeToId(shortcode) {
  let id = 0n;
  for (const ch of shortcode) {
    const value = ALPHABET.indexOf(ch);
    if (value === -1) throw new Error(`caractere invalido no shortcode: ${ch}`);
    id = id * 64n + BigInt(value);
  }
  return id.toString();
}

export function shortcodeFromUrl(url) {
  const match = String(url).match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

const MAX_NOME = 64;

// Nome final do arquivo salvo. Mantem o nome original do CDN quando ele existe
// e e utilizavel; a Biblioteca de Anuncios serve nomes de 100+ caracteres, que
// ficam encurtados. Sem nome na URL, a extensao vem do tipo da midia — chutar
// .jpg em video salvaria um arquivo que o sistema nao abre.
export function filenameFor(url, type, stamp = Date.now()) {
  const original = filenameFromUrl(url);
  if (!original) return `sp3_${stamp}.${type === "video" ? "mp4" : "jpg"}`;

  if (original.length <= MAX_NOME) return original;

  const ponto = original.lastIndexOf(".");
  const extensao = original.slice(ponto);
  return original.slice(0, MAX_NOME - extensao.length) + extensao;
}

export function filenameFromUrl(url) {
  let pathname;
  try {
    pathname = new URL(url, "https://www.instagram.com").pathname;
  } catch {
    return null;
  }
  const last = pathname.split("/").filter(Boolean).pop() ?? "";
  const clean = last.replace(/[^A-Za-z0-9._-]/g, "_");
  return /\.[A-Za-z0-9]{2,4}$/.test(clean) ? clean : null;
}
