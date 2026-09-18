// Companheiros: uma criatura cuida dos hábitos do domínio dela e fica forte
// com todos eles somados. A árvore continua sendo de cada hábito.
//
// Nada de XP guardado em campo próprio — tudo é derivado dos registros.
// Assim não existe o risco clássico de o contador e o histórico discordarem,
// e apagar um registro corrige o progresso sozinho.

import { getState } from "./state.js";
import { ANIMALS, CATEGORY_ELEMENT, getAnimalById } from "../data/animals.js";
import { getStage, getNextStage, getStageProgress, stageName } from "./evolution.js";

// Nenhuma criatura se conquista antes de uma semana de jogo de verdade.
export const MIN_ACTIVE_DAYS = 7;

export function getHabitXp(habitId) {
  return getState()
    .logs.filter((log) => log.habitId === habitId)
    .reduce((total, log) => total + log.xpEarned, 0);
}

/*
  A criatura cresce com tudo que ela cuida, mas só com o que ela própria
  cumpriu: o registro guarda quem cuidava na época. Registros antigos, de
  antes desse campo existir, caem no dono atual do hábito.
*/
export function getAnimalXp(animalId) {
  const state = getState();
  const habitOwner = new Map(state.habits.map((habit) => [habit.id, habit.animalId]));

  return state.logs
    .filter((log) => (log.animalId ?? habitOwner.get(log.habitId)) === animalId)
    .reduce((total, log) => total + log.xpEarned, 0);
}

export function getHabitsOfAnimal(animalId) {
  return getState().habits.filter((habit) => habit.animalId === animalId);
}

// Dias distintos em que a pessoa registrou qualquer coisa: é o "tempo de jogo".
export function getActiveDays() {
  return new Set(getState().logs.map((log) => log.date)).size;
}

export function getCompanionState(habit) {
  const animal = getAnimalById(habit.animalId);
  const xp = animal ? getAnimalXp(animal.id) : 0;
  const stage = getStage(xp);
  return {
    animal,
    xp,
    habitXp: getHabitXp(habit.id),
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

export function isStarterChosen(animal) {
  return getState().user?.selectedAnimalId === animal.id;
}

// Uma inicial só está disponível se foi A escolhida; as outras duas ficam
// perdidas para sempre, por isso nunca entram na conta de conquistáveis.
export function isUnlocked(animal) {
  if (animal.starter) return isStarterChosen(animal);
  if (getActiveDays() < MIN_ACTIVE_DAYS) return false;
  return getCategoryDays(animal.unlock.category) >= animal.unlock.days;
}

export function getUnlockedAnimals() {
  return ANIMALS.filter(isUnlocked);
}

export function getUnlockableAnimals() {
  return ANIMALS.filter((animal) => !animal.starter);
}

/*
  Estado de conquista de uma criatura, incluindo qual dos dois requisitos
  ainda falta — a semana de jogo ou a constância na categoria.
*/
export function getUnlockProgress(animal) {
  if (animal.starter) {
    return {
      kind: "starter",
      unlocked: isStarterChosen(animal),
      // As outras iniciais não são "ainda não", são "nunca".
      forfeited: !isStarterChosen(animal) && Boolean(getState().user?.selectedAnimalId),
    };
  }

  const activeDays = getActiveDays();
  const categoryDays = getCategoryDays(animal.unlock.category);

  return {
    kind: "earned",
    unlocked: activeDays >= MIN_ACTIVE_DAYS && categoryDays >= animal.unlock.days,
    needsMorePlay: activeDays < MIN_ACTIVE_DAYS,
    activeDays,
    minActiveDays: MIN_ACTIVE_DAYS,
    current: categoryDays,
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
