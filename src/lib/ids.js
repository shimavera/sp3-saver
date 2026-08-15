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
