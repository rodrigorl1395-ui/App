/*
  Tema: escuro (o original), claro, ou automático (segue o sistema).

  A escolha é um dado do jogador, não algo derivado — por isso mora em
  settings, do mesmo jeito que o nome em user. Aplicado como atributo no
  <html> porque o CSS inteiro já lê as cores de variáveis; só falta dizer
  qual conjunto usar.
*/

import { getState, setState } from "./state.js";

const STORAGE_KEY = "pocket-habits:state:v1";
const MEDIA = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;

export const THEME_MODES = [
  { id: "automatico", label: "Automático" },
  { id: "escuro", label: "Escuro" },
  { id: "claro", label: "Claro" },
];

export function getThemeMode() {
  return getState().settings?.theme || "automatico";
}

function resolvedTheme(mode) {
  if (mode === "escuro" || mode === "claro") return mode;
  return MEDIA?.matches ? "claro" : "escuro";
}

export function applyTheme() {
  document.documentElement.setAttribute("data-theme", resolvedTheme(getThemeMode()));
}

export function setThemeMode(mode) {
  setState({ settings: { ...getState().settings, theme: mode } });
  applyTheme();
}

// Só importa em modo automático: com um tema travado, o sistema mudar de
// ideia no meio do dia não deveria mudar nada aqui.
MEDIA?.addEventListener?.("change", () => {
  if (getThemeMode() === "automatico") applyTheme();
});

/*
  Antes do primeiro render, sem esperar o resto do estado hidratar: é o que
  evita o flash de tema errado ao abrir o app. Lê o mesmo storage que
  storage.js vai hidratar depois — só o campo de tema, na unha.
*/
export function applyThemeEarly() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const mode = raw ? JSON.parse(raw)?.settings?.theme : null;
    document.documentElement.setAttribute("data-theme", resolvedTheme(mode || "automatico"));
  } catch {
    document.documentElement.setAttribute("data-theme", resolvedTheme("automatico"));
  }
}
