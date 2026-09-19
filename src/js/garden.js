// O Lar: o que cada criatura está fazendo, e onde.
//
// O comportamento não é decorativo — ele conta o estado real do hábito.
// Cumpriu hoje, a criatura pratica aquilo que o hábito treina; não cumpriu,
// ela fica esperando por você.

import { getHabits } from "./habits.js";
import { isDoneToday } from "./missions.js";
import { getCompanionState } from "./companion.js";
import { getMood } from "./mood.js";
import { getPendingDiscovery } from "./discoveries.js";
import { getTreeVigor, vigorAmount } from "./master.js";
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

// Quando o hábito do dia ainda não veio, quem fala é o humor.
const MOOD_ICON = {
  novo: "star",
  sincera: "leaf",
  faminta: "apple",
  saudosa: "droplet",
  descansando: "moon",
};

/*
  Cada criatura cuida de um hábito, então há uma criatura por hábito na cena.
  Cumpriu hoje, ela pratica o que o hábito treina; não cumpriu, o humor é que
  manda — com fome, com saudade ou descansando.
*/
export function getSceneCreatures() {
  return getHabits()
    .map((habit) => {
      const companion = getCompanionState(habit);
      if (!companion.animal) return null;

      const done = isDoneToday(habit.id);
      const mood = getMood(habit.id);
      const activity = done
        ? ACTIVITY_BY_CATEGORY[habit.category] || ACTIVITY_BY_CATEGORY.custom
        : { verb: mood.label, icon: MOOD_ICON[mood.id] || "sprout", motion: mood.motion };

      return {
        habit,
        targetHabit: habit,
        animal: companion.animal,
        pendingDiscovery: getPendingDiscovery(habit, companion.animal),
        stageLabel: companion.stageLabel,
        xp: companion.xp,
        tree: { habit, stage: getTreeStage(companion.habitXp), vigor: getTreeVigor(habit.id) },
        mood,
        done,
        activity,
        // Quem dorme não perambula.
        wanders: activity.motion !== "sleep",
      };
    })
    .filter(Boolean);
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

/*
  Itens do jardim (moradas, árvores decorativas) ficam mais perto das bordas
  e um pouco atrás das árvores dos hábitos — presença de fundo, nunca
  competindo com o que é funcional. Não precisam de precisão contra
  sobreposição: a cena já é estilizada, e um pouco de encontro entre eles
  parece composição, não bug.
*/
export function getDecorPosition(index, total) {
  const spread = 80 / Math.max(total, 1);
  const x = 8 + spread * (index + 0.5) + (index % 2 === 0 ? -4 : 4);
  const y = GROUND_TOP - 4 + ((index * 11) % 10);
  return { x: clamp(x, 6, 92), y };
}

/*
  O que ela faz ao chegar na árvore. É aqui que a ideia fecha: o dia cumprido
  regou a árvore, a árvore deu fruto, e o fruto é a comida. Sem o dia, ela
  chega e não encontra nada — e isso aparece na cena, não num aviso.
*/
export function getFeedingActivity(creature) {
  const vigor = vigorAmount(creature.tree.vigor);
  if (creature.done) return { verb: "comendo os frutos", icon: "apple", motion: "bounce" };
  if (vigor >= 0.5) return { verb: "procurando fruto", icon: "leaf", motion: "idle" };
  if (vigor >= 0.3) return { verb: "com sede pela árvore", icon: "droplet", motion: "idle" };
  return { verb: "dormindo nas raízes", icon: "moon", motion: "sleep" };
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
