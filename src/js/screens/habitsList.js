import {
  createEl,
  createHabitRow,
  createEmptyState,
  createSectionHeader,
  createCreatureBadge,
  accentStyle,
} from "../ui.js";
import { navigate, refresh } from "../router.js";
import { getHabits, removeHabit, setHabitAnimal } from "../habits.js";
import { getCompanionState, getUnlockedAnimals, getSuggestedElement } from "../companion.js";
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
    ? createEl("div", { className: "habit-list", children: habits.map(renderHabitItem) })
    : createEmptyState("Nenhum hábito ainda. Cada hábito ganha uma criatura que cresce com ele.");

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
  const swapButton = createEl("button", {
    className: "link-button",
    text: "Trocar criatura",
    attrs: { type: "button" },
  });

  const row = createHabitRow(habit, {
    action: swapButton,
    companion: getCompanionState(habit),
  });

  const picker = createEl("div", { className: "companion-picker is-collapsed" });
  let open = false;

  swapButton.addEventListener("click", () => {
    open = !open;
    picker.classList.toggle("is-collapsed", !open);
    swapButton.textContent = open ? "Cancelar" : "Trocar criatura";
    if (open && !picker.childElementCount) buildPicker();
  });

  function buildPicker() {
    const preferred = getSuggestedElement(habit.category);
    const available = getUnlockedAnimals()
      .slice()
      .sort((a, b) => (a.element === preferred ? 0 : 1) - (b.element === preferred ? 0 : 1));

    for (const animal of available) {
      const option = createEl("button", {
        className: `companion-option${animal.id === habit.animalId ? " is-selected" : ""}`,
        attrs: { type: "button", style: accentStyle(animal.color) },
        children: [
          createCreatureBadge({ animal, progress: 0 }),
          createEl("span", { className: "companion-option-name", text: animal.name }),
        ],
      });
      option.addEventListener("click", () => {
        setHabitAnimal(habit.id, animal.id);
        refresh();
      });
      picker.appendChild(option);
    }
  }

  const remove = createRemoveAction(habit);

  return createEl("div", {
    className: "habit-item",
    children: [row, picker, createEl("div", { className: "habit-item-actions", children: [remove] })],
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
