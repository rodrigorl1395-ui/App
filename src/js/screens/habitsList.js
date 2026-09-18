import { createEl, createHabitRow, createEmptyState, createSectionHeader } from "../ui.js";
import { navigate, refresh } from "../router.js";
import { getHabits, removeHabit } from "../habits.js";
import { getCompanionState, getAvailableAnimals } from "../companion.js";
import { getMood } from "../mood.js";
import { getFruits } from "../missions.js";
import { getTreeType } from "../../data/trees.js";

export function renderHabitsScreen() {
  const habits = getHabits();
  const available = getAvailableAnimals();

  const newButton = createEl("button", {
    className: "button button-primary button-block",
    text: available.length ? "Novo hábito" : "Conquiste outra criatura para um novo hábito",
    attrs: { type: "button" },
  });
  newButton.disabled = !available.length;
  newButton.addEventListener("click", () => navigate("/novo-habito"));

  const content = habits.length
    ? createEl("div", { className: "habit-list", children: habits.map(renderHabitItem) })
    : createEmptyState("Nenhum hábito ainda. Cada criatura cuida de um, e cresce com ele.");

  const treeSummary = habits.length
    ? createEl("p", {
        className: "tree-hint",
        text: `Seu lar tem ${habits.length} ${habits.length === 1 ? "árvore" : "árvores"}: ${habits
          .map((habit) => getTreeType(habit.treeType).name)
          .join(", ")}.`,
      })
    : null;

  return createEl("div", {
    className: "screen",
    children: [createSectionHeader("Meus hábitos"), content, treeSummary, newButton],
  });
}

function renderHabitItem(habit) {
  const fruits = getFruits(habit.id).length;

  const profileLink = createEl("a", {
    className: "link-button",
    text: "Perfil",
    attrs: { href: `#/criatura?habit=${habit.id}` },
  });

  const row = createHabitRow(habit, {
    action: profileLink,
    companion: getCompanionState(habit),
    mood: getMood(habit.id),
  });

  return createEl("div", {
    className: "habit-item",
    children: [
      row,
      fruits
        ? createEl("p", {
            className: "tree-hint",
            text: `${fruits} ${fruits === 1 ? "fruto guardado" : "frutos guardados"}.`,
          })
        : null,
      createEl("div", {
        className: "habit-item-actions",
        children: [
          createEl("a", {
            className: "link-button",
            text: "Editar",
            attrs: { href: `#/editar-habito?habit=${habit.id}` },
          }),
          createRemoveAction(habit),
        ],
      }),
    ],
  });
}

// Remoção em dois toques: o segundo clique confirma, evitando apagar sem querer.
function createRemoveAction(habit) {
  const button = createEl("button", {
    className: "link-button link-danger",
    text: "Remover",
    attrs: { type: "button" },
  });

  let armed = false;
  button.addEventListener("click", () => {
    if (!armed) {
      armed = true;
      button.textContent = "Confirmar?";
      return;
    }
    removeHabit(habit.id);
    refresh();
  });

  return button;
}
