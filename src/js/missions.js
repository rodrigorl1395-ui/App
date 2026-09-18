// Missões do dia: três níveis por hábito, cada um valendo um XP diferente.
// Concluir a missão mínima já conta — é o que evita o "se não posso fazer
// tudo, então não faço nada".

import { getState, setState } from "./state.js";
import { generateId, todayKey } from "./utils.js";
import { getStage } from "./evolution.js";
import { getAnimalXp, getUnlockedAnimals, findNewlyUnlocked } from "./companion.js";

export const MISSION_LEVELS = {
  minimal: { key: "minimal", label: "Mínima", xp: 10 },
  main: { key: "main", label: "Principal", xp: 25 },
  bonus: { key: "bonus", label: "Bônus", xp: 40 },
};

export function getLogs() {
  return getState().logs;
}

export function getLogForToday(habitId) {
  const today = todayKey();
  return getLogs().find((log) => log.habitId === habitId && log.date === today) || null;
}

export function isDoneToday(habitId) {
  return Boolean(getLogForToday(habitId));
}

/*
  Registra a missão e devolve o que mudou, para a tela comemorar: o XP ganho,
  se o companheiro daquele hábito evoluiu e se algum animal novo foi liberado.
*/
export function completeMission(habit, levelKey) {
  const level = MISSION_LEVELS[levelKey];
  // A evolução olha o XP da criatura (soma dos hábitos dela), não o do hábito.
  const previousXp = getAnimalXp(habit.animalId);
  const previouslyUnlocked = new Set(getUnlockedAnimals().map((animal) => animal.id));

  const log = {
    id: generateId("log"),
    habitId: habit.id,
    // Guardamos quem cuidava na hora: trocar de criatura não pode transferir
    // o esforço já feito para quem acabou de chegar.
    animalId: habit.animalId,
    date: todayKey(),
    level: level.key,
    value: habit.missions[level.key],
    xpEarned: level.xp,
  };

  setState({ logs: [...getLogs(), log] });

  const newXp = previousXp + level.xp;
  const previousStage = getStage(previousXp);
  const currentStage = getStage(newXp);

  return {
    xpEarned: level.xp,
    previousStage,
    currentStage,
    evolved: currentStage.stage > previousStage.stage,
    unlockedAnimals: findNewlyUnlocked(previouslyUnlocked),
  };
}
