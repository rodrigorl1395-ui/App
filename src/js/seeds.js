/*
  Sementes: a moeda derivada de esforço real, nunca guardada em campo
  próprio. Vêm de frutos guardados (prova de reflexão de verdade) e de
  sequências longas — nunca de simplesmente abrir o app.

  Dois catálogos gastam da mesma bolsa — o Jardim (decorativo) e as
  Ferramentas (efeito real) — por isso o "gasto" mora aqui, um lugar só, em
  vez de cada catálogo calcular a própria disponibilidade e permitir gastar
  a mesma semente duas vezes.
*/

import { getState } from "./state.js";
import { getHabits } from "./habits.js";
import { getBestStreak } from "./stats.js";
import { getDecorItem } from "../data/decor.js";
import { getToolItem } from "../data/tools.js";

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

export function getSeedsSpent() {
  const state = getState();
  const noJardim = state.garden.reduce(
    (total, planted) => total + (getDecorItem(planted.itemId)?.cost || 0),
    0
  );
  const emFerramentas = state.tools.reduce(
    (total, obtained) =>
      total + (obtained.source === "loja" ? getToolItem(obtained.toolId)?.cost || 0 : 0),
    0
  );
  return noJardim + emFerramentas;
}

export function getSeedsAvailable() {
  return Math.max(0, getSeedsEarned() - getSeedsSpent());
}
