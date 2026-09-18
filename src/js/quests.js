// A Jornada: avaliação das missões a partir dos registros.
//
// Nada de "conquistada: true" salvo em lugar nenhum. Uma missão está
// conquistada quando o histórico satisfaz o objetivo dela — então apagar um
// registro desfaz a conquista, e importar registros antigos a refaz. O mesmo
// avaliador serve para o objetivo, para cada etapa e para a missão reserva.

import { getState } from "./state.js";
import { getHabitLogs, habitDates, getBestStreak, daysBetween } from "./stats.js";
import { QUESTS } from "../data/quests.js";

function countReturns(habitId) {
  const dates = habitDates(habitId);
  let returns = 0;
  for (let i = 1; i < dates.length; i++) {
    if (daysBetween(dates[i - 1], dates[i]) >= 2) returns++;
  }
  return returns;
}

function measure(type, habit) {
  const logs = getHabitLogs(habit.id);

  switch (type) {
    case "dias":
      return habitDates(habit.id).length;
    case "sequencia":
      return getBestStreak(habit.id);
    case "quantidade":
      return logs.reduce((total, log) => total + (log.value || 0), 0);
    case "bonus":
      return logs.filter((log) => log.level === "bonus").length;
    case "lembrancas":
      return logs.filter((log) => log.reflection).length;
    case "combinados":
      return getState().plans.filter((plan) => plan.habitId === habit.id).length;
    case "retorno":
      return countReturns(habit.id);
    default:
      return 0;
  }
}

export function evaluateGoal(goal, habit) {
  const current = measure(goal.type, habit);
  return {
    current: Math.min(current, goal.amount),
    target: goal.amount,
    done: current >= goal.amount,
  };
}

/*
  Estado completo de uma missão: o objetivo principal, cada etapa e a reserva.
  Conquistar pela reserva vale — é o ponto dela existir.
*/
export function getQuestState(quest, habit) {
  const main = evaluateGoal(quest.goal, habit);
  const reserve = quest.reserve ? evaluateGoal(quest.reserve.goal, habit) : null;

  return {
    quest,
    main,
    reserve,
    steps: quest.steps.map((step) => ({ ...step, progress: evaluateGoal(step.goal, habit) })),
    conquered: main.done || Boolean(reserve?.done),
    byReserve: !main.done && Boolean(reserve?.done),
  };
}

export function getJourney(habit) {
  const states = QUESTS.map((quest) => getQuestState(quest, habit));

  // A missão atual é a primeira ainda não conquistada; as seguintes ficam
  // trancadas para a jornada ter ordem em vez de virar uma lista de tarefas.
  const currentIndex = states.findIndex((state) => !state.conquered);

  return states.map((state, index) => ({
    ...state,
    status:
      state.conquered
        ? "conquistada"
        : index === currentIndex
          ? "atual"
          : "trancada",
  }));
}

// A próxima selada, que o Vislumbre revela.
export function getNextSealedQuestId(habit) {
  return getJourney(habit).find((state) => state.status === "trancada")?.quest.id || null;
}

export function getCurrentQuest(habit) {
  return getJourney(habit).find((state) => state.status === "atual") || null;
}

export function getConqueredCount(habit) {
  return getJourney(habit).filter((state) => state.conquered).length;
}

/*
  Compara a jornada antes e depois de um registro para saber se alguma missão
  foi conquistada agora — é o que dispara a comemoração.
*/
export function findNewlyConquered(habit, previousIds) {
  return getJourney(habit).filter(
    (state) => state.conquered && !previousIds.has(state.quest.id)
  );
}

export function getConqueredIds(habit) {
  return new Set(
    getJourney(habit)
      .filter((state) => state.conquered)
      .map((state) => state.quest.id)
  );
}
