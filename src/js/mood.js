// O humor da criatura é o estado do hábito visto de fora.
//
// Nada aqui pune: quem passou dias sem aparecer encontra a criatura
// descansando, não morrendo. A ausência gera saudade, nunca culpa.

import { getState } from "./state.js";
import { todayKey } from "./utils.js";

export const MOODS = {
  novo: { id: "novo", label: "curiosa", motion: "idle" },
  radiante: { id: "radiante", label: "radiante", motion: "bounce" },
  alegre: { id: "alegre", label: "alegre", motion: "breathe" },
  faminta: { id: "faminta", label: "com fome", motion: "idle" },
  saudosa: { id: "saudosa", label: "sentindo sua falta", motion: "idle" },
  descansando: { id: "descansando", label: "descansando", motion: "sleep" },
};

function habitDates(habitId) {
  return [...new Set(getState().logs.filter((log) => log.habitId === habitId).map((log) => log.date))].sort();
}

function daysBetween(fromKey, toKey) {
  const diff = new Date(`${toKey}T00:00:00`) - new Date(`${fromKey}T00:00:00`);
  return Math.round(diff / 86400000);
}

// Dias seguidos até hoje. Cumprir ontem e ainda não hoje mantém a sequência:
// o dia só quebra quando vira.
export function getStreak(habitId) {
  const dates = habitDates(habitId);
  if (!dates.length) return 0;

  const today = todayKey();
  const last = dates[dates.length - 1];
  const gap = daysBetween(last, today);
  if (gap > 1) return 0;

  let streak = 1;
  for (let i = dates.length - 1; i > 0; i--) {
    if (daysBetween(dates[i - 1], dates[i]) === 1) streak++;
    else break;
  }
  return streak;
}

export function getDaysSinceLast(habitId) {
  const dates = habitDates(habitId);
  if (!dates.length) return null;
  return daysBetween(dates[dates.length - 1], todayKey());
}

export function getMood(habitId) {
  const days = getDaysSinceLast(habitId);
  if (days === null) return MOODS.novo;
  if (days === 0) return getStreak(habitId) >= 3 ? MOODS.radiante : MOODS.alegre;
  if (days === 1) return MOODS.faminta;
  if (days <= 3) return MOODS.saudosa;
  return MOODS.descansando;
}

// A frase que a criatura "diz", na voz dela e sempre acolhedora.
export function getMoodMessage(animal, habitId) {
  const mood = getMood(habitId);
  const days = getDaysSinceLast(habitId);
  const streak = getStreak(habitId);
  const nome = animal?.name || "Sua criatura";

  switch (mood.id) {
    case "novo":
      return `${nome} acabou de chegar e está esperando o primeiro dia.`;
    case "radiante":
      return `${nome} está radiante: ${streak} dias seguidos.`;
    case "alegre":
      return `${nome} foi alimentada hoje.`;
    case "faminta":
      return `${nome} está com fome. Faz um dia.`;
    case "saudosa":
      return `${nome} está sentindo sua falta. Faz ${days} dias.`;
    default:
      return `${nome} está descansando. Você não perdeu sua evolução — suas raízes continuam aqui.`;
  }
}
