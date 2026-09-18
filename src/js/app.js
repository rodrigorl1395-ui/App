import { getState, hydrate, subscribe } from "./state.js";
import { loadState, saveState } from "./storage.js";
import { registerRoute, setNotFound, initRouter } from "./router.js";
import { renderAppShell } from "./ui.js";
import { renderTodayScreen } from "./screens/today.js";
import { generateId } from "./utils.js";

function bootstrapState() {
  const persisted = loadState();
  if (persisted) {
    hydrate(persisted);
  } else {
    hydrate({
      meta: { firstOpenedAt: new Date().toISOString(), deviceId: generateId("device") },
    });
    saveState(getState());
  }
  subscribe((state) => saveState(state));
}

function registerRoutes() {
  registerRoute("/hoje", () => renderTodayScreen(getState()));
  setNotFound(() => renderTodayScreen(getState()));
}

function start() {
  bootstrapState();
  registerRoutes();

  const appRoot = document.getElementById("app");
  const { root, main } = renderAppShell({ activePath: "/hoje" });
  appRoot.appendChild(root);

  initRouter(main, "/hoje");
}

document.addEventListener("DOMContentLoaded", start);
