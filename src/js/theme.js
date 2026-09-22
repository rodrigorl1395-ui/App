/*
  Tema: escuro (o original), claro, ou automático (segue o sistema).

  A escolha é um dado do jogador, não algo derivado — por isso mora em
  settings, do mesmo jeito que o nome em user. Aplicado como atributo no
  <html> porque o CSS inteiro já lê as cores de variáveis; só falta dizer
  qual conjunto usar.
*/

import { getState, setState } from "./state.js";
import { getAnimalById } from "../data/animals.js";

const STORAGE_KEY = "pocket-habits:state:v1";
const MEDIA = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;

/*
  O trio de luz de fundo, por elemento — não é decoração solta, é a cor do
  guardião escolhido tomando conta do fundo do app inteiro. Cada trio mistura
  a cor do elemento com uma vizinha e uma quente, pra sempre sobrar contraste
  entre os três focos em vez de tudo virar uma mancha só.
*/
const GLOW_SETS = {
  fogo: ["#ff8a4c", "#f2c14e", "#e2543f"],
  agua: ["#5fc2d9", "#1d7d8c", "#9b8cfa"],
  ar: ["#9ec7e8", "#c3b8e8", "#5fc2d9"],
  terra: ["#a3c168", "#e2b04e", "#8fae5c"],
  luz: ["#f2c14e", "#ff9a52", "#b39ddb"],
  espirito: ["#b39ddb", "#6f5fd8", "#6db3f2"],
};
const DEFAULT_GLOW = ["#6a3fd6", "#14a3ad", "#e0581f"];

/*
  Reescreve o brilho de fundo pela cor do guardião escolhido. Sem guardião
  ainda (onboarding), fica no trio padrão. Chamada no boot e a cada mudança
  de estado — é barata, e é a única forma de pegar o instante em que a
  pessoa escolhe o inicial sem acoplar este arquivo à tela de escolha.
*/
export function applyAmbientGlow() {
  const animalId = getState().user?.selectedAnimalId;
  const animal = animalId ? getAnimalById(animalId) : null;
  const [violeta, teal, brasa] = (animal && GLOW_SETS[animal.element]) || DEFAULT_GLOW;
  const root = document.documentElement.style;
  root.setProperty("--glow-violet", violeta);
  root.setProperty("--glow-teal", teal);
  root.setProperty("--glow-ember", brasa);
}

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
