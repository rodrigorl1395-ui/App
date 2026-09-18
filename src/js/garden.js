// O Lar: o que cada criatura está fazendo, e onde.
//
// O comportamento não é decorativo — ele conta o estado real do hábito.
// Cumpriu hoje, a criatura pratica aquilo que o hábito treina; não cumpriu,
// ela fica esperando por você.

import { getHabits } from "./habits.js";
import { isDoneToday } from "./missions.js";
import { getCompanionState } from "./companion.js";
import { getTreeStage } from "../data/trees.js";

// O que a criatura faz quando o hábito do dia já foi cumprido.
const ACTIVITY_BY_CATEGORY = {
  movimento: { verb: "treinando", icon: "flame", motion: "bounce" },
  mente: { verb: "lendo", icon: "book", motion: "read" },
  recuperacao: { verb: "dormindo", icon: "moon", motion: "sleep" },
  corpo: { verb: "se alimentando", icon: "apple", motion: "bounce" },
  equilibrio: { verb: "meditando", icon: "sprout", motion: "breathe" },
  custom: { verb: "brincando", icon: "star", motion: "bounce" },
};

const WAITING = { verb: "esperando você", icon: "sprout", motion: "idle" };

/*
  Uma criatura por animal, não por hábito: quem cuida de três hábitos aparece
  uma vez só, com as três árvores por perto. Ela só pratica quando todos os
  hábitos dela estão cumpridos; faltando algum, fica esperando.
*/
export function getSceneCreatures() {
  const byAnimal = new Map();

  for (const habit of getHabits()) {
    const companion = getCompanionState(habit);
    if (!companion.animal) continue;

    if (!byAnimal.has(companion.animal.id)) {
      byAnimal.set(companion.animal.id, {
        animal: companion.animal,
        stageLabel: companion.stageLabel,
        xp: companion.xp,
        habits: [],
        trees: [],
      });
    }

    const entry = byAnimal.get(companion.animal.id);
    entry.habits.push({ habit, done: isDoneToday(habit.id) });
    entry.trees.push({ habit, stage: getTreeStage(companion.habitXp) });
  }

  return [...byAnimal.values()].map((entry) => {
    const pending = entry.habits.find((item) => !item.done);
    const activity = pending
      ? WAITING
      : ACTIVITY_BY_CATEGORY[entry.habits[0].habit.category] || ACTIVITY_BY_CATEGORY.custom;

    return {
      ...entry,
      // Tocar leva à missão que ainda falta; se tudo foi feito, à primeira.
      targetHabit: (pending || entry.habits[0]).habit,
      done: !pending,
      activity,
      // Quem dorme não perambula.
      wanders: activity.motion !== "sleep",
    };
  });
}

/*
  Todo mundo vive no chão, na metade de baixo da cena. Espalhamos em x e
  escalonamos o y para ninguém nascer alinhado como vitrine — quem está mais
  embaixo aparece maior, o que dá a sensação de profundidade.
*/
export const GROUND_TOP = 38;
export const GROUND_BOTTOM = 86;

export function getStartPosition(index, total) {
  const spread = 72 / Math.max(total, 1);
  const x = 14 + spread * (index + 0.5) + (index % 2 === 0 ? 3 : -3);
  const y = GROUND_TOP + 4 + ((index * 13) % (GROUND_BOTTOM - GROUND_TOP - 8));
  return { x: clamp(x, 12, 88), y };
}

// Árvores ficam plantadas mais ao fundo, atrás de onde as criaturas andam.
export function getTreePosition(index, total) {
  const spread = 76 / Math.max(total, 1);
  return {
    x: clamp(12 + spread * (index + 0.5), 10, 90),
    y: GROUND_TOP - 2 + ((index * 9) % 16),
  };
}

// Quanto mais perto do rodapé, maior a criatura.
export function depthScale(y) {
  const t = (y - GROUND_TOP) / (GROUND_BOTTOM - GROUND_TOP);
  return 0.82 + t * 0.38;
}

// Alvo aleatório dentro da cena, às vezes perto de outra criatura — é o que
// faz elas parecerem se encontrar, sem precisar de IA nenhuma.
export function pickTarget(current, others) {
  const nearSomeone = others.length > 0 && Math.random() < 0.3;

  if (nearSomeone) {
    const friend = others[Math.floor(Math.random() * others.length)];
    // Para do lado, nunca por cima: sem distância mínima os orbes empilham e
    // o encontro parece defeito em vez de interação.
    const side = Math.random() < 0.5 ? -1 : 1;
    return {
      x: clamp(friend.x + side * randomBetween(11, 17), 12, 88),
      y: clamp(friend.y + randomBetween(-4, 4), GROUND_TOP + 2, GROUND_BOTTOM),
    };
  }

  return {
    x: clamp(current.x + randomBetween(-28, 28), 12, 88),
    y: clamp(current.y + randomBetween(-12, 12), GROUND_TOP + 2, GROUND_BOTTOM),
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
