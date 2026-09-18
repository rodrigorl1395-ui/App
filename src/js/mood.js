// O humor da criatura é o estado do hábito visto de fora.
//
// Nada aqui pune: quem passou dias sem aparecer encontra a criatura
// descansando, não morrendo. A ausência gera saudade, nunca culpa.

import { getStreak, getDaysSinceLast } from "./stats.js";

export { getStreak, getDaysSinceLast };

export const MOODS = {
  novo: { id: "novo", label: "curiosa", motion: "idle" },
  radiante: { id: "radiante", label: "radiante", motion: "bounce" },
  alegre: { id: "alegre", label: "alegre", motion: "breathe" },
  faminta: { id: "faminta", label: "com fome", motion: "idle" },
  saudosa: { id: "saudosa", label: "sentindo sua falta", motion: "idle" },
  descansando: { id: "descansando", label: "descansando", motion: "sleep" },
};

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
