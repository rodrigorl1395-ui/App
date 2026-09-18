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

/*
  O ritual do hábito tem três atos, e só o do meio é obrigatório:

  1. Combinar — onde e quando vai acontecer. Dito antes, em voz própria,
     é o que mais aumenta a chance de acontecer de verdade.
  2. Cumprir  — a missão mínima, principal ou bônus.
  3. Guardar  — uma linha positiva sobre o dia. Vira um fruto na árvore.

  A árvore cresce por fazer; o fruto nasce por refletir.
*/

export function getPlanForToday(habitId) {
  const today = todayKey();
  return getState().plans.find((plan) => plan.habitId === habitId && plan.date === today) || null;
}

export function savePlan(habitId, text) {
  const today = todayKey();
  const plans = getState().plans.filter((plan) => !(plan.habitId === habitId && plan.date === today));
  setState({ plans: [...plans, { habitId, date: today, text }] });
}

// Como a pessoa se sentiu. Fica junto da lembrança, no registro do dia.
export const FEELINGS = [
  { id: "leve", label: "Leve" },
  { id: "forte", label: "Forte" },
  { id: "dificil", label: "Foi difícil" },
  { id: "valeu", label: "Valeu a pena" },
];

// A lembrança vai no registro do dia: é o fruto daquele dia.
export function saveReflection(logId, text, feeling = null) {
  setState({
    logs: getLogs().map((log) =>
      log.id === logId ? { ...log, reflection: text, feeling } : log
    ),
  });
}

export function getFeelingLabel(id) {
  return FEELINGS.find((feeling) => feeling.id === id)?.label || null;
}

export function getFruits(habitId) {
  return getLogs()
    .filter((log) => log.habitId === habitId && log.reflection)
    .sort((a, b) => b.date.localeCompare(a.date));
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
    time: new Date().toTimeString().slice(0, 5),
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
