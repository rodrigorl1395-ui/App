import { getState, hydrate, subscribe } from "./state.js";
import { loadState, saveState } from "./storage.js";
import { registerRoute, setNotFound, setGuard, initRouter } from "./router.js";
import { renderAppShell } from "./ui.js";
import { renderTodayScreen } from "./screens/today.js";
import { renderOnboardingScreen } from "./screens/onboarding.js";
import { renderChooseAnimalScreen } from "./screens/chooseAnimal.js";
import { renderHabitsScreen } from "./screens/habitsList.js";
import { renderNewHabitScreen } from "./screens/newHabit.js";
import { renderMissionScreen } from "./screens/mission.js";
import { renderSanctuaryScreen } from "./screens/sanctuary.js";
import { renderHomeScreen } from "./screens/home.js";
import { renderCreatureScreen } from "./screens/creature.js";
import { generateId } from "./utils.js";

const ENTRY_PATHS = ["/onboarding", "/escolha-animal"];

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
  registerRoute("/onboarding", renderOnboardingScreen, { chromeless: true });
  registerRoute("/escolha-animal", renderChooseAnimalScreen, { chromeless: true });
  registerRoute("/hoje", renderTodayScreen);
  registerRoute("/habitos", renderHabitsScreen);
  registerRoute("/novo-habito", renderNewHabitScreen);
  registerRoute("/missao", renderMissionScreen, { chromeless: true });
  registerRoute("/santuario", renderSanctuaryScreen);
  registerRoute("/lar", renderHomeScreen);
  registerRoute("/criatura", renderCreatureScreen);
  setNotFound(renderTodayScreen);

  setGuard((path) => {
    const hasAnimal = Boolean(getState().user?.selectedAnimalId);
    if (!hasAnimal && !ENTRY_PATHS.includes(path)) return "/onboarding";
    if (hasAnimal && ENTRY_PATHS.includes(path)) return "/hoje";
    return null;
  });
}

function start() {
  bootstrapState();
  registerRoutes();

  const hasAnimal = Boolean(getState().user?.selectedAnimalId);
  const appRoot = document.getElementById("app");
  const { root, main } = renderAppShell({ activePath: "/hoje" });
  appRoot.appendChild(root);

  initRouter(main, hasAnimal ? "/hoje" : "/onboarding");
}

document.addEventListener("DOMContentLoaded", start);
