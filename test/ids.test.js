import test from "node:test";
import assert from "node:assert/strict";
import {
  shortcodeToId,
  shortcodeFromUrl,
  filenameFromUrl,
  filenameFor,
} from "../src/lib/ids.js";

test("shortcodeToId converte shortcode conhecido", () => {
  assert.equal(shortcodeToId("B"), "1");
  assert.equal(shortcodeToId("BA"), "64");
  assert.equal(shortcodeToId("CwPnfNlLQzy"), "3174929931019554034");
});

test("shortcodeToId rejeita caractere invalido", () => {
  assert.throws(() => shortcodeToId("abc!"), /caractere invalido/);
});

test("shortcodeFromUrl entende post, reel e tv", () => {
  assert.equal(shortcodeFromUrl("https://www.instagram.com/p/CwPnfNlLQzy/"), "CwPnfNlLQzy");
  assert.equal(
    shortcodeFromUrl("https://www.instagram.com/reel/CwPnfNlLQzy/?img_index=2"),
    "CwPnfNlLQzy"
  );
  assert.equal(shortcodeFromUrl("/tv/CwPnfNlLQzy/"), "CwPnfNlLQzy");
  assert.equal(shortcodeFromUrl("https://www.instagram.com/juan/"), null);
});

test("filenameFromUrl limpa query string", () => {
  const url =
    "https://scontent.cdninstagram.com/v/t51.29350-15/473738383_1122334455_n.jpg?stp=dst-jpg&_nc_ht=x";
  assert.equal(filenameFromUrl(url), "473738383_1122334455_n.jpg");
});

test("filenameFromUrl devolve null sem extensao reconhecivel", () => {
  assert.equal(filenameFromUrl("https://scontent.cdninstagram.com/v/t51/"), null);
});

test("filenameFor encurta nome gigante do CDN mantendo a extensao", () => {
  const gigante = "A".repeat(120) + ".mp4";
  const nome = filenameFor(`https://scontent.fbcdn.net/o1/v/t2/f2/m412/${gigante}`, "video", 111);
  assert.ok(nome.length <= 64, `nome ficou com ${nome.length} caracteres`);
  assert.ok(nome.endsWith(".mp4"));
});

test("filenameFor mantem nome curto intacto", () => {
  const url = "https://scontent.cdninstagram.com/v/t51/473738383_1122334455_n.jpg?stp=x";
  assert.equal(filenameFor(url, "image", 111), "473738383_1122334455_n.jpg");
});

test("filenameFor usa extensao do tipo quando a url nao tem nome", () => {
  assert.equal(filenameFor("https://scontent.fbcdn.net/o1/v/t2/", "video", 111), "sp3_111.mp4");
  assert.equal(filenameFor("https://scontent.fbcdn.net/o1/v/t2/", "image", 111), "sp3_111.jpg");
});
