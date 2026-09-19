/*
  Sementes e o jardim decorativo.

  Sementes são derivadas, como os achados: vêm de frutos guardados (a prova
  de uma reflexão real) e de sequências longas — nunca de simplesmente abrir
  o app ou cumprir uma missão qualquer. É o que as mantém raras o bastante
  para significar alguma coisa, em vez de virarem uma segunda barra de XP.

  O que foi plantado é a única coisa guardada aqui: uma escolha da pessoa,
  como collected e powerUses. O saldo de sementes nunca é um número salvo —
  é sempre ganhas menos gastas, calculado na hora.
*/

import { getState, setState } from "./state.js";
import { getHabits } from "./habits.js";
import { getBestStreak } from "./stats.js";
import { generateId } from "./utils.js";
import { DECOR_ITEMS, getDecorItem } from "../data/decor.js";

const FRUITS_PER_SEED = 3;
const STREAK_MILESTONES = [7, 30, 100];

/*
  Uma semente a cada três frutos guardados (em qualquer hábito), mais uma
  por marco de sequência que cada hábito já alcançou na vida dele. Sequência
  atual pode cair — a semente ganha por tê-la alcançado uma vez não some
  junto, do mesmo jeito que um fruto colhido não apodrece se você parar.
*/
export function getSeedsEarned() {
  const state = getState();
  const fruitSeeds = Math.floor(
    state.logs.filter((log) => log.reflection).length / FRUITS_PER_SEED
  );
  const milestoneSeeds = getHabits().reduce((total, habit) => {
    const best = getBestStreak(habit.id);
    return total + STREAK_MILESTONES.filter((marco) => best >= marco).length;
  }, 0);
  return fruitSeeds + milestoneSeeds;
}

export function getGarden() {
  return getState().garden;
}

export function getSeedsSpent() {
  return getGarden().reduce((total, planted) => total + (getDecorItem(planted.itemId)?.cost || 0), 0);
}

export function getSeedsAvailable() {
  return Math.max(0, getSeedsEarned() - getSeedsSpent());
}

// O catálogo com o que já foi possível pagar, e quantas vezes cada item já
// foi plantado — nada impede repetir uma morada ou uma árvore.
export function getCatalog() {
  const available = getSeedsAvailable();
  const garden = getGarden();
  return DECOR_ITEMS.map((item) => ({
    ...item,
    ownedCount: garden.filter((planted) => planted.itemId === item.id).length,
    affordable: available >= item.cost,
  }));
}

export function plantItem(itemId) {
  const item = getDecorItem(itemId);
  if (!item || getSeedsAvailable() < item.cost) return null;

  const planted = { id: generateId("decor"), itemId, plantedAt: new Date().toISOString() };
  setState({ garden: [...getGarden(), planted] });
  return planted;
}
