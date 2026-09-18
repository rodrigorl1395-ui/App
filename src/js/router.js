// Router hash-based mínimo. Cada rota é uma função que retorna um nó DOM.
// Preparado para crescer (novas telas) sem mudar o mecanismo.

const routes = new Map();
let rootEl = null;
let notFoundHandler = null;
let guardFn = null;

export function registerRoute(path, renderFn, { chromeless = false } = {}) {
  routes.set(path, { renderFn, chromeless });
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

function currentPath() {
  return window.location.hash.replace(/^#/, "") || "/";
}

function render() {
  const path = currentPath();

  const redirect = guardFn ? guardFn(path) : null;
  if (redirect && redirect !== path) {
    navigate(redirect);
    return;
  }

  const entry = routes.get(path);
  const handler = entry?.renderFn || notFoundHandler;
  document.body.classList.toggle("is-chromeless", Boolean(entry?.chromeless));
  rootEl.replaceChildren();
  if (handler) {
    rootEl.appendChild(handler());
  }
  highlightNav(path);
}

function highlightNav(path) {
  document.querySelectorAll("[data-nav-link]").forEach((el) => {
    el.classList.toggle("is-active", el.getAttribute("href") === `#${path}`);
  });
}
