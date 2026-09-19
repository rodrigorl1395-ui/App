// O humor da criatura é o estado do hábito visto de fora.
//
// Nada aqui pune: quem passou dias sem aparecer encontra a criatura
// descansando, não morrendo. A ausência gera saudade, nunca culpa.

import { getStreak, getDaysSinceLast } from "./stats.js";
import { getMissForToday } from "./missions.js";

export { getStreak, getDaysSinceLast };

export const MOODS = {
  novo: { id: "novo", label: "curiosa", motion: "idle" },
  radiante: { id: "radiante", label: "radiante", motion: "bounce" },
  alegre: { id: "alegre", label: "alegre", motion: "breathe" },
  // Diferente de sumir: a criatura sabe que você esteve aqui hoje, mesmo sem
  // ter cumprido — é o que a admissão ("hoje não vai dar") muda para ela.
  sincera: { id: "sincera", label: "esperando amanhã", motion: "idle" },
  faminta: { id: "faminta", label: "com fome", motion: "idle" },
  saudosa: { id: "saudosa", label: "sentindo sua falta", motion: "idle" },
  descansando: { id: "descansando", label: "descansando", motion: "sleep" },
};

export function getMood(habitId) {
  // O que aconteceu hoje fala mais alto que a média dos dias — mesmo num
  // hábito recém-criado, sem nenhum dia cumprido ainda, admitir hoje já é
  // diferente de nunca ter aparecido.
  if (getMissForToday(habitId)) return MOODS.sincera;

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
    case "sincera":
      return `${nome} sabe que hoje não deu. Ela só está esperando amanhã.`;
    case "faminta":
      return `${nome} está com fome. Faz um dia.`;
    case "saudosa":
      return `${nome} está sentindo sua falta. Faz ${days} dias.`;
    default:
      return `${nome} está descansando. Você não perdeu sua evolução — suas raízes continuam aqui.`;
  }
}
