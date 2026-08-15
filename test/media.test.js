import test from "node:test";
import assert from "node:assert/strict";
import { collectMedia, matchIndexByUrl } from "../src/lib/media.js";

const version = (name, width) => ({ url: `https://cdn/${name}?x=1`, width });

test("collectMedia pega a maior imagem de um post simples", () => {
  const item = {
    media_type: 1,
    image_versions2: { candidates: [version("a.jpg", 640), version("b.jpg", 1440)] },
  };
  assert.deepEqual(collectMedia(item), [{ type: "image", url: "https://cdn/b.jpg?x=1" }]);
});

test("collectMedia prefere video quando existe", () => {
  const item = {
    media_type: 2,
    image_versions2: { candidates: [version("poster.jpg", 1080)] },
    video_versions: [version("low.mp4", 480), version("hi.mp4", 1080)],
  };
  assert.deepEqual(collectMedia(item), [{ type: "video", url: "https://cdn/hi.mp4?x=1" }]);
});

test("collectMedia devolve um item por slide do carrossel", () => {
  const item = {
    media_type: 8,
    carousel_media: [
      { media_type: 1, image_versions2: { candidates: [version("1.jpg", 1080)] } },
      {
        media_type: 2,
        image_versions2: { candidates: [version("2.jpg", 1080)] },
        video_versions: [version("2.mp4", 1080)],
      },
    ],
  };
  assert.deepEqual(collectMedia(item), [
    { type: "image", url: "https://cdn/1.jpg?x=1" },
    { type: "video", url: "https://cdn/2.mp4?x=1" },
  ]);
});

test("collectMedia lanca erro quando nao ha midia", () => {
  assert.throws(() => collectMedia({ media_type: 1 }), /sem midia/);
});

test("matchIndexByUrl acha o slide visivel pelo nome do arquivo", () => {
  const list = [
    { url: "https://cdn/1.jpg?a=1" },
    { url: "https://cdn/2.mp4?a=1" },
    { url: "https://cdn/3.jpg?a=1" },
  ];
  assert.equal(matchIndexByUrl(["https://outro-cdn/2.mp4?b=9"], list), 1);
});

test("matchIndexByUrl cai para zero quando nao reconhece", () => {
  assert.equal(matchIndexByUrl(["https://cdn/z.jpg"], [{ url: "https://cdn/1.jpg" }]), 0);
});
