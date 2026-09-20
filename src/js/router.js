// Router hash-based mínimo. Cada rota é uma função que retorna um nó DOM.
// Preparado para crescer (novas telas) sem mudar o mecanismo.

const routes = new Map();
let rootEl = null;
let notFoundHandler = null;
let guardFn = null;

/*
  chromeless: sem cabeçalho e sem navegação (onboarding, missão).
  fullbleed: mantém a navegação, mas entrega a área inteira para a tela —
  é o que permite o Jardim ser o mundo ocupando tudo, sem cabeçalho nem
  respiro de página em volta.
*/
export function registerRoute(path, renderFn, { chromeless = false, fullbleed = false } = {}) {
  routes.set(path, { renderFn, chromeless, fullbleed });
}

export function setNotFound(renderFn) {
  notFoundHandler = renderFn;
}

// guardFn(path) pode retornar um novo path para redirecionar, ou null/undefined
// para deixar a navegação seguir normalmente.
export function setGuard(fn) {
  guardFn = fn;
}

export function initRouter(root, defaultPath) {
  rootEl = root;
  window.addEventListener("hashchange", render);
  if (!window.location.hash) {
    window.location.hash = defaultPath;
  } else {
    render();
  }
}

export function navigate(path) {
  window.location.hash = path;
}

// Re-renderiza a rota atual (ex.: depois de alterar dados que a tela mostra).
export function refresh() {
  render();
}

// "#/missao?habit=abc" vira { path: "/missao", params: { habit: "abc" } }.
function parseHash() {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [path, query = ""] = raw.split("?");
  return { path, params: Object.fromEntries(new URLSearchParams(query)) };
}

function render() {
  const { path, params } = parseHash();

  const redirect = guardFn ? guardFn(path) : null;
  if (redirect && redirect !== path) {
    navigate(redirect);
    return;
  }

  const entry = routes.get(path);
  const handler = entry?.renderFn || notFoundHandler;
  document.body.classList.toggle("is-chromeless", Boolean(entry?.chromeless));
  document.body.classList.toggle("is-fullbleed", Boolean(entry?.fullbleed));
  rootEl.replaceChildren();
  if (handler) {
    rootEl.appendChild(handler(params));
  }
  highlightNav(path);
}

function highlightNav(path) {
  document.querySelectorAll("[data-nav-link]").forEach((el) => {
    el.classList.toggle("is-active", el.getAttribute("href") === `#${path}`);
  });
}
