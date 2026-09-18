import { createEl, createHabitRow, createEmptyState, createSectionHeader } from "../ui.js";
import { navigate, refresh } from "../router.js";
import { getHabits, removeHabit } from "../habits.js";
import { getTreeType } from "../../data/trees.js";

export function renderHabitsScreen() {
  const habits = getHabits();

  const newButton = createEl("button", {
    className: "button button-primary button-block",
    text: "Novo hábito",
    attrs: { type: "button" },
  });
  newButton.addEventListener("click", () => navigate("/novo-habito"));

  const content = habits.length
    ? createEl("div", {
        className: "habit-list",
        children: habits.map((habit) => createHabitRow(habit, { action: createRemoveAction(habit) })),
      })
    : createEmptyState("Nenhum hábito ainda. Cada hábito criado vira uma árvore no seu jardim.");

  const treeSummary = habits.length
    ? createEl("p", {
        className: "tree-hint",
        text: `Seu jardim terá ${habits.length} ${habits.length === 1 ? "árvore" : "árvores"}: ${habits
          .map((habit) => getTreeType(habit.treeType).name)
          .join(", ")}.`,
      })
    : null;

  return createEl("div", {
    className: "screen",
    children: [createSectionHeader("Meus hábitos"), content, treeSummary, newButton],
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
