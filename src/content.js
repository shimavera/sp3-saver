// Content script declarado no manifest NAO aceita `import` estatico:
// o Chrome ignora `"type": "module"` em content_scripts e o arquivo inteiro
// morre com "Cannot use import statement outside a module".
// Por isso este arquivo e um carregador sem import, que puxa o resto
// dinamicamente a partir da URL da extensao.
(async () => {
  try {
    await import(chrome.runtime.getURL("src/main.js"));
  } catch (err) {
    console.error("[ig-saver] falhei ao carregar o modulo principal:", err);
  }
})();
