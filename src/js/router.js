// Router hash-based mínimo. Cada rota é uma função que retorna um nó DOM.
// Preparado para crescer (novas telas) sem mudar o mecanismo.

const routes = new Map();
let rootEl = null;
let notFoundHandler = null;

export function registerRoute(path, renderFn) {
  routes.set(path, renderFn);
}

export function setNotFound(renderFn) {
  notFoundHandler = renderFn;
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

function currentPath() {
  return window.location.hash.replace(/^#/, "") || "/";
}

function render() {
  const path = currentPath();
  const handler = routes.get(path) || notFoundHandler;
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
