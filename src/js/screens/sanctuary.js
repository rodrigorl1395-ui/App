import { createEl, createCreatureBadge, createSectionHeader, accentStyle } from "../ui.js";
import { ANIMALS, CATEGORY_LABELS, getElement } from "../../data/animals.js";
import {
  getUnlockProgress,
  getAnimalXp,
  getHabitOfAnimal,
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

/*
  O quanto falta para desbloquear, sempre olhando para o que realmente está
  travando: enquanto a semana de jogo não fecha, é ela que importa — mostrar
  a constância na categoria antes disso confundiria (podia estar em 100% e
  seguir trancada). Depois da semana, quem manda é a categoria.
*/
function unlockRatio(unlock) {
  if (unlock.kind !== "earned" || unlock.unlocked) return null;
  const ratio = unlock.needsMorePlay
    ? unlock.activeDays / unlock.minActiveDays
    : unlock.current / unlock.required;
  return Math.max(0, Math.min(1, ratio));
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
    const habit = getHabitsOfAnimal(animal.id).length ? getHabitOfAnimal(animal.id) : null;
    const { note } = describe(animal, unlock);
    const ratio = unlockRatio(unlock);

    // Batizada, é o nome dela que aparece — a espécie vira legenda, não título.
    const displayName = habit?.guardianName || animal.name;
    const lines = [createEl("span", { className: "sanctuary-name", text: displayName })];

    if (unlock.unlocked && habit) {
      lines.push(
        habit.guardianName
          ? createEl("span", { className: "sanctuary-lock", text: animal.name })
          : null,
        createEl("span", {
          className: "sanctuary-stage",
          text: stageName(getStage(xp), animal.gender),
        }),
        createEl("span", { className: "sanctuary-xp", text: `${xp} XP` })
      );
    } else if (unlock.unlocked) {
      lines.push(
        createEl("span", { className: "sanctuary-stage", text: getElement(animal.element).label }),
        // Pronta e livre: dizer isso como convite, não como pendência.
        createEl("span", { className: "sanctuary-xp is-ready", text: "Pronta — toque para dar um hábito a ela" })
      );
    } else {
      lines.push(createEl("span", { className: "sanctuary-lock", text: note }));
      if (ratio !== null) {
        lines.push(
          createEl("div", {
            className: "sanctuary-progress",
            children: [
              createEl("span", {
                className: "sanctuary-progress-fill",
                attrs: { style: `width: ${Math.round(ratio * 100)}%` },
              }),
            ],
          })
        );
      }
    }

    const classes = ["sanctuary-card"];
    if (!unlock.unlocked) classes.push("is-locked");
    if (unlock.forfeited) classes.push("is-forfeited");
    // Um empurrão visual só para quem está mesmo perto — longe disso o brilho
    // vira ruído em vez de motivação.
    if (ratio !== null && ratio >= 0.7) classes.push("is-close");

    const badge = createCreatureBadge({
      animal,
      progress: unlock.unlocked && habit ? getStageProgress(xp) : 0,
      locked: !unlock.unlocked,
    });
    const body = createEl("div", { className: "sanctuary-body", children: lines });

    // Só vira link quando há algo real para fazer: ver o perfil de quem já
    // cuida de um hábito, ou começar um para quem está livre e pronta.
    const href = unlock.unlocked
      ? habit
        ? `#/criatura?habit=${habit.id}`
        : `#/novo-habito?animal=${animal.id}`
      : null;

    return createEl(href ? "a" : "div", {
      className: classes.join(" "),
      attrs: { style: accentStyle(animal.color), ...(href ? { href } : {}) },
      children: [badge, body],
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
