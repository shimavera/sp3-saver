import test from "node:test";
import assert from "node:assert/strict";
import { collectMedia, matchIndexByUrl } from "../src/lib/media.js";
import { resolveFromDom, resolveFromPageData } from "../src/resolver.js";

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

test("resolveFromDom prioriza o arquivo MP4 sobre imagens visiveis", () => {
  assert.deepEqual(
    resolveFromDom(["https://cdn/capa.jpg", "https://cdn/video.mp4?token=abc"]),
    { list: [{ type: "video", url: "https://cdn/video.mp4?token=abc" }], index: 0 }
  );
});

test("resolveFromDom nao trata poster como video quando nao ha MP4", () => {
  assert.deepEqual(resolveFromDom(["https://cdn/foto.jpg"]), {
    list: [{ type: "image", url: "https://cdn/foto.jpg" }],
    index: 0,
  });
});

test("resolveFromDom usa MP4 observado na rede e remove o trecho parcial", () => {
  const url = "https://cdninstagram.example/video.mp4?bytestart=10&byteend=20&token=x";
  assert.deepEqual(resolveFromDom([], [url]), {
    list: [{ type: "video", url: "https://cdninstagram.example/video.mp4?token=x" }],
    index: 0,
  });
});

test("resolveFromPageData escolhe o MP4 do shortcode pedido, nao outro reel sugerido", () => {
  const pageJsonTexts = [JSON.stringify({
    require: [{ result: { data: {
      edges: [
        { node: { media: { code: "OUTRO", video_versions: [{ width: 1080, url: "https://cdn/outro.mp4" }] } } },
        { node: { media: { code: "Dewo9q0zUIx", video_versions: [
          { width: 480, url: "https://cdn/reel-baixo.mp4" },
          { width: 720, url: "https://cdn/reel-com-audio.mp4" },
        ] } } },
      ],
    } } }],
  })];

  assert.deepEqual(resolveFromPageData("https://www.instagram.com/reels/Dewo9q0zUIx/", [], pageJsonTexts), {
    list: [{ type: "video", url: "https://cdn/reel-com-audio.mp4" }],
    index: 0,
  });
});

test("resolveFromPageData nao usa dados de outro reel", () => {
  const pageJsonTexts = [JSON.stringify({ code: "OUTRO", video_versions: [version("outro.mp4", 720)] })];
  assert.equal(resolveFromPageData("https://www.instagram.com/reels/Dewo9q0zUIx/", [], pageJsonTexts), null);
});

test("resolveFromPageData mantem o slide visivel do carrossel correto", () => {
  const pageJsonTexts = [JSON.stringify({ edges: [
    { node: { media: { code: "OUTRO", carousel_media: [
      { image_versions2: { candidates: [version("outra.jpg", 800)] } },
    ] } } },
    { node: { media: { code: "ALVO", carousel_media: [
      { image_versions2: { candidates: [version("primeira.jpg", 800)] } },
      { video_versions: [version("segunda.mp4", 720)] },
    ] } } },
  ] })];

  assert.deepEqual(
    resolveFromPageData("https://www.instagram.com/p/ALVO/", ["https://cdn/segunda.mp4?x=1"], pageJsonTexts),
    {
      list: [
        { type: "image", url: "https://cdn/primeira.jpg?x=1" },
        { type: "video", url: "https://cdn/segunda.mp4?x=1" },
      ],
      index: 1,
    }
  );
});

test("resolveFromDom rejeita MP4 DASH separado do audio", () => {
  const efg = Buffer.from(JSON.stringify({ vencode_tag: "igwww-C3.dash_r2evevp9_q90" })).toString("base64");
  assert.throws(
    () => resolveFromDom([], [`https://cdn/video.mp4?efg=${efg}&bytestart=0&byteend=817`], true),
    /video completo com audio/
  );
});

test("resolveFromDom nao baixa uma imagem quando o player e video", () => {
  assert.throws(() => resolveFromDom(["https://cdn/poster.jpg"], [], true), /video completo com audio/);
});
