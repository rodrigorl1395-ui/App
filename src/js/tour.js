/*
  Motor do tour guiado — ver data/tour.js para os passos e a filosofia.

  Estado mínimo, do jeito que o resto do app guarda escolha: só o passo
  atual e se foi concluído ou pulado. Nenhum XP nem recompensa é gerado
  aqui — o tour só aponta o caminho até o que o app já entrega de verdade.
*/

import { getState, setState, subscribe } from "./state.js";
import { getHabits } from "./habits.js";
import { isDoneToday } from "./missions.js";
import { TOUR_STEPS } from "../data/tour.js";

export function isTourActive() {
  const tour = getState().tour;
  return Boolean(tour && !tour.done && !tour.skipped);
}

export function isTourDone() {
  return Boolean(getState().tour?.done);
}

export function getCurrentTourStep() {
  const tour = getState().tour;
  if (!tour || tour.done || tour.skipped) return null;
  return TOUR_STEPS[tour.step] || null;
}

/*
  Quem chama decide se este era o primeiro hábito — newHabit.js sabe isso
  no instante exato, antes de criar o próximo (depois de criado, contar
  os hábitos já não diria mais nada). O guard aqui é só contra chamar duas
  vezes: uma vez que o tour existe, nada o reinicia.
*/
export function startTourIfFirstHabit() {
  if (getState().tour) return;
  setState({ tour: { step: 0, done: false, skipped: false } });
}

export function advanceTour() {
  const tour = getState().tour;
  if (!tour || tour.done || tour.skipped) return;
  const next = tour.step + 1;
  setState({ tour: { ...tour, step: next, done: next >= TOUR_STEPS.length } });
}

export function skipTour() {
  const tour = getState().tour;
  if (!tour) return;
  setState({ tour: { ...tour, skipped: true } });
}

// Telas reais chamam isto quando algo relevante acontece (tocar numa
// árvore, por exemplo). Só tem efeito se o passo atual estiver mesmo
// esperando esse sinal — em qualquer outro momento, é um no-op.
export function notifyTourSignal(signal) {
  const step = getCurrentTourStep();
  if (step?.type === "acao" && step.signal === signal) advanceTour();
}

function currentPath() {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  return raw.split("?")[0];
}

/*
  Um passo "acao" com watchPath avança sozinho ao abrir a tela certa
  (visitar o Perfil do Mestre, por exemplo) — não precisa de botão.

  Passo "nav" nunca avança pela rota: logo depois de criar o hábito, a
  própria navegação para Hoje já dispararia um hashchange, o que fecharia
  o primeiro passo (explicar o botão Hoje) antes da pessoa ler qualquer
  coisa. "Entendi" é sempre um clique de verdade.
*/
window.addEventListener("hashchange", () => {
  const step = getCurrentTourStep();
  if (step?.type === "acao" && step.watchPath && currentPath() === step.watchPath) advanceTour();
});

subscribe(() => {
  const step = getCurrentTourStep();
  if (step?.id !== "missao-cumprir") return;
  const primeiro = getHabits()[0];
  if (primeiro && isDoneToday(primeiro.id)) advanceTour();
});
