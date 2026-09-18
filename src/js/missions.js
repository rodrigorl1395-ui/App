// Missões do dia: três níveis por hábito, cada um valendo um XP diferente.
// Concluir a missão mínima já conta — é o que evita o "se não posso fazer
// tudo, então não faço nada".

import { getState, setState } from "./state.js";
import { generateId, todayKey } from "./utils.js";
import { getStage } from "./evolution.js";

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
  Conclui a missão de um hábito e devolve o que mudou, para a tela poder
  comemorar: XP ganho, total novo e o estágio anterior/atual do companheiro.
*/
export function completeMission(habit, levelKey) {
  const level = MISSION_LEVELS[levelKey];
  const previousXp = getState().user.xp || 0;
  const newXp = previousXp + level.xp;

  const log = {
    id: generateId("log"),
    habitId: habit.id,
    date: todayKey(),
    level: level.key,
    value: habit.missions[level.key],
    xpEarned: level.xp,
  };

  setState({
    logs: [...getLogs(), log],
    user: { ...getState().user, xp: newXp },
  });

  return {
    xpEarned: level.xp,
    previousStage: getStage(previousXp),
    currentStage: getStage(newXp),
    evolved: getStage(newXp).stage > getStage(previousXp).stage,
  };
}
