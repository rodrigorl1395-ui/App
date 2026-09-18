import { createEl, createCreatureBadge, createSectionHeader, accentStyle } from "../ui.js";
import { ANIMALS, CATEGORY_LABELS, getElement } from "../../data/animals.js";
import {
  getUnlockProgress,
  getAnimalXp,
  getHabitsOfAnimal,
  getActiveDays,
  getUnlockableAnimals,
  MIN_ACTIVE_DAYS,
} from "../companion.js";
import { getStage, getStageProgress, stageName } from "../evolution.js";

// Uma linha por criatura, dizendo em que pé ela está.
function describe(animal, unlock) {
  if (unlock.kind === "starter") {
    if (unlock.unlocked) return { stage: null, note: "Sua escolha inicial" };
    return { stage: null, note: "Inicial não escolhida — não pode ser conquistada" };
  }

  if (unlock.unlocked) return { stage: null, note: null };

  const categoria = CATEGORY_LABELS[animal.unlock.category] || animal.unlock.category;
  if (unlock.needsMorePlay) {
    return {
      stage: null,
      note: `Depois de ${MIN_ACTIVE_DAYS} dias de jogo — você tem ${unlock.activeDays}`,
    };
  }
  return { stage: null, note: `${unlock.current} de ${unlock.required} dias de ${categoria}` };
}

export function renderSanctuaryScreen() {
  const unlockable = getUnlockableAnimals();
  const conquered = unlockable.filter((animal) => getUnlockProgress(animal).unlocked).length;
  const activeDays = getActiveDays();

  const intro = createEl("p", {
    className: "tree-hint",
    text:
      activeDays < MIN_ACTIVE_DAYS
        ? `Nenhuma criatura se conquista antes de ${MIN_ACTIVE_DAYS} dias de jogo. Você tem ${activeDays}.`
        : `${conquered} de ${unlockable.length} criaturas conquistadas. A constância em cada área do seu dia liberta as próximas.`,
  });

  const cards = ANIMALS.map((animal) => {
    const unlock = getUnlockProgress(animal);
    const xp = getAnimalXp(animal.id);
    const inUse = getHabitsOfAnimal(animal.id).length > 0;
    const { note } = describe(animal, unlock);

    const lines = [createEl("span", { className: "sanctuary-name", text: animal.name })];

    if (unlock.unlocked && inUse) {
      lines.push(
        createEl("span", {
          className: "sanctuary-stage",
          text: stageName(getStage(xp), animal.gender),
        }),
        createEl("span", { className: "sanctuary-xp", text: `${xp} XP` })
      );
    } else if (unlock.unlocked) {
      lines.push(
        createEl("span", { className: "sanctuary-stage", text: getElement(animal.element).label }),
        createEl("span", { className: "sanctuary-xp", text: note || "Sem hábito ainda" })
      );
    } else {
      lines.push(createEl("span", { className: "sanctuary-lock", text: note }));
    }

    const classes = ["sanctuary-card"];
    if (!unlock.unlocked) classes.push("is-locked");
    if (unlock.forfeited) classes.push("is-forfeited");

    return createEl("div", {
      className: classes.join(" "),
      attrs: { style: accentStyle(animal.color) },
      children: [
        createCreatureBadge({
          animal,
          progress: unlock.unlocked && inUse ? getStageProgress(xp) : 0,
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
