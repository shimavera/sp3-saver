const CSS = `
  :host { all: initial; }
  .wrap {
    position: absolute; top: 12px; right: 12px; z-index: 9999;
    display: flex; gap: 6px; align-items: center;
    font: 600 12px/1 -apple-system, system-ui, sans-serif;
    opacity: 0; transition: opacity .15s ease;
  }
  .wrap.visible { opacity: 1; }
  button {
    all: unset; cursor: pointer; display: grid; place-items: center;
    width: 34px; height: 34px; border-radius: 999px;
    background: rgba(20,20,20,.72); color: #fff;
    backdrop-filter: blur(6px);
    box-shadow: 0 2px 8px rgba(0,0,0,.35);
  }
  button:hover { background: rgba(20,20,20,.9); }
  button.all { width: auto; padding: 0 12px; height: 30px; font-size: 11px; }
  .badge {
    padding: 4px 8px; border-radius: 999px;
    background: rgba(20,20,20,.72); color: #fff; backdrop-filter: blur(6px);
  }
  .hidden { display: none; }
  :host([data-state="loading"]) .icon { animation: spin .8s linear infinite; }
  :host([data-state="done"]) button.save { background: #1a9c4b; }
  :host([data-state="error"]) button.save { background: #c0392b; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const ICONS = {
  idle: `<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 12 5 5 5-5"/><path d="M4 20h16"/></svg>`,
  loading: `<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 3a9 9 0 1 0 9 9"/></svg>`,
  done: `<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12 5 5L20 6"/></svg>`,
  error: `<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 6v8"/><path d="M12 18h.01"/></svg>`,
};

export function createSaveButton({ onSave, onSaveAll }) {
  const host = document.createElement("div");
  host.dataset.state = "idle";
  const root = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = CSS;

  const wrap = document.createElement("div");
  wrap.className = "wrap";
  wrap.innerHTML = `
    <span class="badge hidden"></span>
    <button class="all hidden" type="button">todos</button>
    <button class="save" type="button" title="Salvar">${ICONS.idle}</button>
  `;

  root.append(style, wrap);

  const badge = wrap.querySelector(".badge");
  const allBtn = wrap.querySelector("button.all");
  const saveBtn = wrap.querySelector("button.save");

  const stop = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  saveBtn.addEventListener("click", (e) => {
    stop(e);
    onSave();
  });
  allBtn.addEventListener("click", (e) => {
    stop(e);
    onSaveAll();
  });

  let resetTimer;
  function setState(state, message = "") {
    clearTimeout(resetTimer);
    host.dataset.state = state;
    saveBtn.innerHTML = ICONS[state] ?? ICONS.idle;
    saveBtn.title = message || (state === "loading" ? "Baixando..." : "Salvar");
    if (state === "done" || state === "error") {
      resetTimer = setTimeout(() => setState("idle"), state === "done" ? 1500 : 4000);
    }
  }

  function setCount(index, total) {
    const many = total > 1;
    badge.classList.toggle("hidden", !many);
    allBtn.classList.toggle("hidden", !many);
    if (many) badge.textContent = `${index + 1}/${total}`;
  }

  function setVisible(visible) {
    wrap.classList.toggle("visible", visible);
  }

  return { host, setState, setCount, setVisible };
}
