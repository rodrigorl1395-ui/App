// Tudo que se sabe sobre um hábito é derivado dos registros — nada aqui é
// guardado em campo próprio. O histórico é a fonte da verdade; as métricas,
// o calendário e a linha do tempo são leituras dele.

import { getState } from "./state.js";
import { todayKey } from "./utils.js";
import { getStage, stageName } from "./evolution.js";
import { getTreeStage } from "../data/trees.js";

export function getHabitLogs(habitId) {
  return getState()
    .logs.filter((log) => log.habitId === habitId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function habitDates(habitId) {
  return [...new Set(getHabitLogs(habitId).map((log) => log.date))].sort();
}

export function daysBetween(fromKey, toKey) {
  const diff = new Date(`${toKey}T00:00:00`) - new Date(`${fromKey}T00:00:00`);
  return Math.round(diff / 86400000);
}

// Dias seguidos até hoje. Cumprir ontem e ainda não hoje mantém a sequência:
// o dia só quebra quando vira.
export function getStreak(habitId) {
  const dates = habitDates(habitId);
  if (!dates.length) return 0;
  if (daysBetween(dates[dates.length - 1], todayKey()) > 1) return 0;

  let streak = 1;
  for (let i = dates.length - 1; i > 0; i--) {
    if (daysBetween(dates[i - 1], dates[i]) === 1) streak++;
    else break;
  }
  return streak;
}

export function getBestStreak(habitId) {
  const dates = habitDates(habitId);
  if (!dates.length) return 0;

  let best = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    run = daysBetween(dates[i - 1], dates[i]) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

export function getDaysSinceLast(habitId) {
  const dates = habitDates(habitId);
  if (!dates.length) return null;
  return daysBetween(dates[dates.length - 1], todayKey());
}

function monthKey(dateKey) {
  return dateKey.slice(0, 7);
}

function shiftMonth(key, delta) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Segunda-feira da semana de uma data, em chave ISO.
function weekStart(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  const weekday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - weekday);
  return date.toISOString().slice(0, 10);
}

/*
  A pergunta que o perfil responde não é "quantas vezes você fez", e sim
  "como você está evoluindo em relação a você mesmo" — por isso consistência
  e comparação com o mês anterior vêm junto do total.
*/
export function getHabitStats(habit) {
  const logs = getHabitLogs(habit.id);
  const dates = habitDates(habit.id);
  const today = todayKey();
  const createdKey = habit.createdAt.slice(0, 10);

  const daysSinceCreated = Math.max(1, daysBetween(createdKey, today) + 1);
  const thisWeek = weekStart(today);
  const thisMonth = monthKey(today);
  const lastMonth = shiftMonth(thisMonth, -1);

  const weekDays = dates.filter((date) => weekStart(date) === thisWeek).length;
  const monthDays = dates.filter((date) => monthKey(date) === thisMonth).length;
  const lastMonthDays = dates.filter((date) => monthKey(date) === lastMonth).length;

  const xp = logs.reduce((total, log) => total + log.xpEarned, 0);

  return {
    total: logs.length,
    activeDays: dates.length,
    daysSinceCreated,
    consistency: Math.round((dates.length / daysSinceCreated) * 100),
    currentStreak: getStreak(habit.id),
    bestStreak: getBestStreak(habit.id),
    weekDays,
    weeklyTarget: habit.weeklyTarget || 7,
    monthDays,
    lastMonthDays,
    monthDelta: monthDays - lastMonthDays,
    amount: logs.reduce((total, log) => total + (log.value || 0), 0),
    xp,
    stage: getStage(xp),
    treeStage: getTreeStage(xp),
    fruits: logs.filter((log) => log.reflection).length,
  };
}

/*
  Calendário de um mês: cada dia com o que aconteceu nele. "parcial" é o dia
  em que só a missão mínima saiu — vale como dia cumprido, mas o calendário
  mostra a diferença.
*/
export function getMonthCalendar(habitId, monthOffset = 0) {
  const base = shiftMonth(monthKey(todayKey()), monthOffset);
  const [year, month] = base.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  const byDate = new Map();
  for (const log of getHabitLogs(habitId)) {
    // Ficar com o melhor nível do dia: quem fez mínima e depois principal
    // merece ver o dia como cumprido.
    const previous = byDate.get(log.date);
    if (!previous || previous === "parcial") {
      byDate.set(log.date, log.level === "minimal" ? "parcial" : "cumprido");
    }
  }

  const days = [];
  // Casas vazias até cair na coluna certa (semana começando na segunda).
  for (let i = 0; i < (first.getDay() + 6) % 7; i++) days.push(null);

  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${base}-${String(day).padStart(2, "0")}`;
    days.push({
      day,
      date: key,
      status: byDate.get(key) || (key > todayKey() ? "futuro" : "vazio"),
    });
  }

  return {
    monthKey: base,
    label: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(first),
    days,
  };
}

/*
  A linha do tempo é reconstruída percorrendo os registros em ordem: cada
  travessia de estágio, cada marca de sequência, vira uma frase. Como nada
  é guardado, apagar um registro reescreve a história corretamente.
*/
export function getTimeline(habit, animal) {
  const logs = getHabitLogs(habit.id);
  const events = [
    { date: habit.createdAt.slice(0, 10), text: "Você plantou esta árvore." },
  ];

  if (!logs.length) return events;

  let xp = 0;
  let stage = getStage(0).stage;
  let treeStage = getTreeStage(0).stage;
  let streak = 0;
  let bestStreak = 0;
  let previousDate = null;
  const seenDates = new Set();
  const nome = animal?.name || "Sua criatura";

  for (const log of logs) {
    if (!seenDates.size) events.push({ date: log.date, text: "Primeiro progresso registrado." });

    if (!seenDates.has(log.date)) {
      streak = previousDate && daysBetween(previousDate, log.date) === 1 ? streak + 1 : 1;
      previousDate = log.date;
      seenDates.add(log.date);

      for (const marco of [7, 30, 100]) {
        if (streak === marco && bestStreak < marco) {
          events.push({ date: log.date, text: `${marco} dias seguidos.` });
        }
      }
      bestStreak = Math.max(bestStreak, streak);
    }

    xp += log.xpEarned;

    const nextTree = getTreeStage(xp).stage;
    if (nextTree > treeStage) {
      treeStage = nextTree;
      events.push({ date: log.date, text: `A árvore chegou a ${getTreeStage(xp).name.toLowerCase()}.` });
    }

    const nextStage = getStage(xp).stage;
    if (nextStage > stage) {
      stage = nextStage;
      events.push({
        date: log.date,
        text: `${nome} evoluiu para ${stageName(getStage(xp), animal?.gender)}.`,
      });
    }
  }

  return events;
}
