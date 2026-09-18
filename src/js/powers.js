// Cargas e uso dos poderes.
//
// Mesma divisão do resto do app: o que é conquistado se deriva do histórico
// (uma carga a cada cinco dias cumpridos), e o que é escolha da pessoa fica
// guardado (quais cargas foram gastas, e em quê).

import { getState, setState } from "./state.js";
import { habitDates } from "./stats.js";
import { generateId, todayKey } from "./utils.js";
import { getPowerForElement, DAYS_PER_CHARGE } from "../data/powers.js";

export function getPowerUses(habitId) {
  return getState().powerUses.filter((use) => use.habitId === habitId);
}

export function getCharges(habit) {
  const earned = Math.floor(habitDates(habit.id).length / DAYS_PER_CHARGE);
  return Math.max(0, earned - getPowerUses(habit.id).length);
}

export function getNextChargeIn(habit) {
  const days = habitDates(habit.id).length;
  return DAYS_PER_CHARGE - (days % DAYS_PER_CHARGE);
}

export function getUseForToday(habit) {
  const today = todayKey();
  return getPowerUses(habit.id).find((use) => use.date === today) || null;
}

export function isRestDay(habitId, date) {
  return getState().powerUses.some(
    (use) => use.habitId === habitId && use.date === date && use.powerId === "mare-calma"
  );
}

export function getRestDays(habitId) {
  return getPowerUses(habitId)
    .filter((use) => use.powerId === "mare-calma")
    .map((use) => use.date);
}

export function getRevealedQuests(habitId) {
  return getPowerUses(habitId)
    .filter((use) => use.powerId === "vislumbre")
    .map((use) => use.payload);
}

/*
  Usa o poder da criatura. Um por dia: o poder é um gesto do dia, não um
  recurso para queimar em sequência.
*/
export function usePower(habit, animal, payload = null) {
  const power = getPowerForElement(animal?.element);
  if (!power || getCharges(habit) < 1 || getUseForToday(habit)) return null;

  const use = {
    id: generateId("power"),
    habitId: habit.id,
    animalId: animal.id,
    powerId: power.id,
    date: todayKey(),
    payload,
  };

  setState({ powerUses: [...getState().powerUses, use] });
  return use;
}

// Efeitos ativos hoje, lidos na hora de registrar a missão.
export function getActiveEffects(habit) {
  const use = getUseForToday(habit);
  return {
    dobraXp: use?.powerId === "brasa-dobrada",
    minimaValeComoPrincipal: use?.powerId === "raiz-profunda",
    descansando: use?.powerId === "mare-calma",
  };
}
