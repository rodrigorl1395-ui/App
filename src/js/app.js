import { getState, hydrate, subscribe } from "./state.js";
import { loadState, saveState } from "./storage.js";
import { applyThemeEarly, applyTheme } from "./theme.js";
import { registerRoute, setNotFound, setGuard, initRouter } from "./router.js";
import { renderAppShell } from "./ui.js";
import { renderTodayScreen } from "./screens/today.js";
import { renderOnboardingScreen } from "./screens/onboarding.js";
import { renderChooseAnimalScreen } from "./screens/chooseAnimal.js";
import { renderHabitsScreen } from "./screens/habitsList.js";
import { renderNewHabitScreen } from "./screens/newHabit.js";
import { renderMissionScreen } from "./screens/mission.js";
import { renderSanctuaryScreen } from "./screens/sanctuary.js";
import { renderCreatureScreen } from "./screens/creature.js";
import { renderEditHabitScreen } from "./screens/editHabit.js";
import { renderGardenScreen, renderHomeScreen } from "./screens/garden.js";
import { renderSettingsScreen } from "./screens/settings.js";
import { renderToolsScreen } from "./screens/tools.js";
import { generateId } from "./utils.js";

// Antes de tudo, sem esperar o resto do estado hidratar: evita o flash do
// tema errado ao abrir o app.
applyThemeEarly();

const ENTRY_PATHS = ["/onboarding", "/escolha-animal"];

/*
  Ajustes fica acessível antes do onboarding porque é lá que se restaura um
  backup. Sem isso, quem troca de aparelho teria que criar tudo de novo antes
  de conseguir recuperar o próprio histórico — o oposto do que o backup serve.
*/
const ALWAYS_OPEN = ["/ajustes"];

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
  applyTheme();
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
  // O mundo ocupa a tela inteira: fullbleed tira o cabeçalho e o respiro
  // de página, e deixa só a navegação por cima do jardim.
  registerRoute("/jardim", renderGardenScreen, { fullbleed: true });
  registerRoute("/lar", renderHomeScreen, { fullbleed: true });
  registerRoute("/criatura", renderCreatureScreen);
  registerRoute("/editar-habito", renderEditHabitScreen);
  registerRoute("/ajustes", renderSettingsScreen);
  registerRoute("/ferramentas", renderToolsScreen);
  setNotFound(renderTodayScreen);

  setGuard((path) => {
    const hasAnimal = Boolean(getState().user?.selectedAnimalId);
    if (ALWAYS_OPEN.includes(path)) return null;
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
