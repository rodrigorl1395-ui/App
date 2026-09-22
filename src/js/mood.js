// O humor da criatura é o estado do hábito visto de fora.
//
// Isto nunca reescreve o histórico: uma missão mínima continua contando o
// dia como cumprido, e sumir nunca apaga a evolução. Mas a criatura tem
// sentimento de verdade — fazer menos do que o combinado, ou admitir que
// hoje não deu, deixa ela visivelmente triste, não indiferente. Fingir que
// está tudo bem quando não está seria mentir pra pessoa, não só pra ela.

import { getStreak, getDaysSinceLast } from "./stats.js";
import { getMissForToday, getLogForToday } from "./missions.js";

export { getStreak, getDaysSinceLast };

export const MOODS = {
  novo: { id: "novo", label: "curiosa", motion: "idle" },
  radiante: { id: "radiante", label: "radiante", motion: "bounce" },
  alegre: { id: "alegre", label: "alegre", motion: "breathe" },
  // Cumpriu o mínimo: o dia conta e a sequência segue de pé, mas ela sabe
  // que dava mais — e mostra isso, em vez de comemorar igual a um dia cheio.
  insatisfeita: { id: "insatisfeita", label: "poderia ter sido mais", motion: "idle" },
  // Diferente de sumir: a criatura sabe que você esteve aqui hoje, mesmo sem
  // ter cumprido — é o que a admissão ("hoje não vai dar") muda para ela.
  sincera: { id: "sincera", label: "triste, mas de pé", motion: "idle" },
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
  if (days === 0) {
    if (getLogForToday(habitId)?.level === "minimal") return MOODS.insatisfeita;
    return getStreak(habitId) >= 3 ? MOODS.radiante : MOODS.alegre;
  }
  if (days === 1) return MOODS.faminta;
  if (days <= 3) return MOODS.saudosa;
  return MOODS.descansando;
}

// A frase que a criatura "diz", na voz dela e sempre acolhedora.
export function getMoodMessage(animal, habitId) {
  const mood = getMood(habitId);
  const days = getDaysSinceLast(habitId);
  const streak = getStreak(habitId);
  const nome = animal?.name || "Seu guardião";

  switch (mood.id) {
    case "novo":
      return `${nome} acabou de chegar e está esperando o primeiro dia.`;
    case "radiante":
      return `${nome} está radiante: ${streak} dias seguidos.`;
    case "alegre":
      return `${nome} foi alimentada hoje.`;
    case "insatisfeita":
      return `${nome} comeu só o mínimo hoje. Deu pra manter a sequência, mas ela sabe que dava mais.`;
    case "sincera":
      return `${nome} ficou triste, mas não foi embora. Amanhã ela tenta de novo.`;
    case "faminta":
      return `${nome} está com fome. Faz um dia.`;
    case "saudosa":
      return `${nome} está sentindo sua falta. Faz ${days} dias.`;
    default:
      return `${nome} está descansando. Você não perdeu sua evolução — suas raízes continuam aqui.`;
  }
}
