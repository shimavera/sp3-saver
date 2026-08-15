chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "download") return false;

  chrome.downloads
    .download({ url: msg.url, filename: msg.filename, saveAs: false })
    .then((id) => sendResponse({ ok: true, id }))
    .catch((err) => sendResponse({ ok: false, error: String(err?.message ?? err) }));

  return true; // resposta assíncrona
});
