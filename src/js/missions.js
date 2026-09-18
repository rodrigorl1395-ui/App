// Missões do dia: três níveis por hábito, cada um valendo um XP diferente.
// Concluir a missão mínima já conta — é o que evita o "se não posso fazer
// tudo, então não faço nada".

import { getState, setState } from "./state.js";
import { generateId, todayKey } from "./utils.js";
import { getStage } from "./evolution.js";
import { getAnimalXp, getUnlockedAnimals, findNewlyUnlocked } from "./companion.js";
import { getActiveEffects } from "./powers.js";

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
  O nível sai do que foi feito, e não o contrário: quem correu 45 num plano de
  30 registrou um bônus, mesmo tendo digitado o valor à mão.
*/
export function levelForValue(habit, value) {
  if (value >= habit.missions.bonus) return "bonus";
  if (value >= habit.missions.main) return "main";
  return "minimal";
}

/*
  Registra a missão e devolve o que mudou, para a tela comemorar.

  value é o que aconteceu de verdade. Sem ele, assume-se a meta daquele nível
  — é o caminho rápido de um toque. Com ele, o histórico guarda o número real,
  que é a única forma de "225 min acumulados" significar alguma coisa.
*/
export function completeMission(habit, levelKey, value = null) {
  const realValue = value ?? habit.missions[levelKey];
  const level = MISSION_LEVELS[value === null ? levelKey : levelForValue(habit, realValue)];
  const effects = getActiveEffects(habit);

  /*
    Os poderes mexem no XP do registro, nunca no fato de ter acontecido: o
    dia só entra no histórico porque a pessoa cumpriu. A mínima valendo como
    principal continua sendo uma mínima no calendário.
  */
  let xpEarned = level.xp;
  if (effects.minimaValeComoPrincipal && level.key === "minimal") {
    xpEarned = MISSION_LEVELS.main.xp;
  }
  if (effects.dobraXp) xpEarned *= 2;
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
    value: realValue,
    xpEarned,
  };

  setState({ logs: [...getLogs(), log] });

  const newXp = previousXp + xpEarned;
  const previousStage = getStage(previousXp);
  const currentStage = getStage(newXp);

  return {
    xpEarned,
    previousStage,
    currentStage,
    evolved: currentStage.stage > previousStage.stage,
    unlockedAnimals: findNewlyUnlocked(previouslyUnlocked),
  };
}
