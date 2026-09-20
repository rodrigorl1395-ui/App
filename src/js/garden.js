// O que cada criatura está fazendo no mundo.
//
// O comportamento não é decorativo — ele conta o estado real do hábito.
// Cumpriu hoje, a criatura pratica aquilo que o hábito treina; não cumpriu,
// ela fica esperando por você.
//
// O posicionamento em si mora em world/scene.js: quando o Lar e o Jardim
// viraram o mesmo terreno, o desenho passou para o canvas e este arquivo
// ficou só com a pergunta de negócio ("como ela está hoje?").

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
  insatisfeita: "leaf",
  sincera: "leaf",
  faminta: "apple",
  saudosa: "droplet",
  descansando: "moon",
};

/*
  Cada criatura cuida de um hábito, então há uma criatura por hábito na cena.
  Cumpriu no mínimo, ela mostra que sabia que dava mais — a mesma regra de
  "não pune o histórico" não significa fingir que não fez diferença nenhuma.
  Só cumprindo de verdade (principal ou bônus) ela comemora.
*/
export function getSceneCreatures() {
  return getHabits()
    .map((habit) => {
      const companion = getCompanionState(habit);
      if (!companion.animal) return null;

      const done = isDoneToday(habit.id);
      const mood = getMood(habit.id);
      const comemorando = done && mood.id !== "insatisfeita";
      const activity = comemorando
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
