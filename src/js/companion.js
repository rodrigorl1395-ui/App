// Companheiros: um por hábito, crescendo com aquele hábito.
//
// Nada de XP guardado em campo próprio — tudo é derivado dos registros.
// Assim não existe o risco clássico de o contador e o histórico discordarem,
// e apagar um registro corrige o progresso sozinho.

import { getState } from "./state.js";
import { ANIMALS, CATEGORY_ELEMENT, getAnimalById } from "../data/animals.js";
import { getStage, getNextStage, getStageProgress, stageName } from "./evolution.js";

export function getHabitXp(habitId) {
  return getState()
    .logs.filter((log) => log.habitId === habitId)
    .reduce((total, log) => total + log.xpEarned, 0);
}

export function getTotalXp() {
  return getState().logs.reduce((total, log) => total + log.xpEarned, 0);
}

// Tudo que uma tela precisa saber sobre o companheiro de um hábito.
export function getCompanionState(habit) {
  const xp = getHabitXp(habit.id);
  const animal = getAnimalById(habit.animalId);
  const stage = getStage(xp);
  return {
    animal,
    xp,
    stage,
    stageLabel: stageName(stage, animal?.gender),
    nextStage: getNextStage(xp),
    progress: getStageProgress(xp),
  };
}

/*
  Domínio de categoria: quantos dias distintos a pessoa cumpriu algum hábito
  daquela categoria. Contamos dias, não registros, para que cumprir três
  hábitos num dia só não valha como três dias de constância.
*/
export function getCategoryDays(category) {
  const state = getState();
  const habitIds = new Set(
    state.habits.filter((habit) => habit.category === category).map((habit) => habit.id)
  );

  const days = new Set(
    state.logs.filter((log) => habitIds.has(log.habitId)).map((log) => log.date)
  );

  return days.size;
}

export function isUnlocked(animal) {
  if (!animal.unlock) return true;
  return getCategoryDays(animal.unlock.category) >= animal.unlock.days;
}

export function getUnlockedAnimals() {
  return ANIMALS.filter(isUnlocked);
}

// Quanto falta para liberar — alimenta o santuário e o aviso de desbloqueio.
export function getUnlockProgress(animal) {
  if (!animal.unlock) return { unlocked: true, current: 0, required: 0 };
  const current = getCategoryDays(animal.unlock.category);
  return {
    unlocked: current >= animal.unlock.days,
    current,
    required: animal.unlock.days,
  };
}

/*
  Animais que passaram a estar disponíveis entre dois momentos. Usado logo
  depois de registrar uma missão, para avisar na hora da comemoração.
*/
export function findNewlyUnlocked(previouslyUnlockedIds) {
  return getUnlockedAnimals().filter((animal) => !previouslyUnlockedIds.has(animal.id));
}

export function getSuggestedElement(category) {
  return CATEGORY_ELEMENT[category] || null;
}
