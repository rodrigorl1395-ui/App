import { createEl, createCreatureBadge, createSectionHeader, accentStyle } from "../ui.js";
import { ANIMALS, CATEGORY_LABELS, getElement } from "../../data/animals.js";
import { getUnlockProgress, getHabitXp } from "../companion.js";
import { getHabits } from "../habits.js";
import { getStage, getStageProgress, stageName } from "../evolution.js";

export function renderSanctuaryScreen() {
  const habits = getHabits();

  // Um animal pode cuidar de mais de um hábito; o progresso mostrado é o do
  // hábito em que ele está mais adiantado.
  const bestXpByAnimal = new Map();
  for (const habit of habits) {
    const xp = getHabitXp(habit.id);
    if (xp > (bestXpByAnimal.get(habit.animalId) || 0)) {
      bestXpByAnimal.set(habit.animalId, xp);
    }
  }

  const unlockedCount = ANIMALS.filter((animal) => getUnlockProgress(animal).unlocked).length;

  const intro = createEl("p", {
    className: "tree-hint",
    text: `${unlockedCount} de ${ANIMALS.length} criaturas conquistadas. A constância em cada área do seu dia liberta as próximas.`,
  });

  const cards = ANIMALS.map((animal) => {
    const unlock = getUnlockProgress(animal);
    const xp = bestXpByAnimal.get(animal.id);
    const inUse = xp !== undefined;

    const lines = [createEl("span", { className: "sanctuary-name", text: animal.name })];

    if (!unlock.unlocked) {
      lines.push(
        createEl("span", {
          className: "sanctuary-lock",
          text: `${unlock.current} de ${unlock.required} dias de ${
            CATEGORY_LABELS[animal.unlock.category] || animal.unlock.category
          }`,
        })
      );
    } else if (inUse) {
      lines.push(
        createEl("span", {
          className: "sanctuary-stage",
          text: stageName(getStage(xp), animal.gender),
        }),
        createEl("span", { className: "sanctuary-xp", text: `${xp} XP` })
      );
    } else {
      lines.push(
        createEl("span", { className: "sanctuary-stage", text: getElement(animal.element).label }),
        createEl("span", { className: "sanctuary-xp", text: "Sem hábito ainda" })
      );
    }

    return createEl("div", {
      className: `sanctuary-card${unlock.unlocked ? "" : " is-locked"}`,
      attrs: { style: accentStyle(animal.color) },
      children: [
        createCreatureBadge({
          animal,
          progress: inUse ? getStageProgress(xp) : 0,
          locked: !unlock.unlocked,
        }),
        createEl("div", { className: "sanctuary-body", children: lines }),
      ],
    });
  });

  return createEl("div", {
    className: "screen",
    children: [
      createSectionHeader("Santuário"),
      intro,
      createEl("div", { className: "sanctuary-grid", children: cards }),
    ],
  });
}
