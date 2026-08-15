import test from "node:test";
import assert from "node:assert/strict";
import { shortcodeToId, shortcodeFromUrl, filenameFromUrl } from "../src/lib/ids.js";

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
