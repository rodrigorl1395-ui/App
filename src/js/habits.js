// Regras de negócio dos hábitos. Não toca no DOM: só lê e escreve estado.

import { getState, setState } from "./state.js";
import { generateId } from "./utils.js";

export function getHabits() {
  return getState().habits;
}

export function createHabit({ name, unit, color, icon, treeType, missions, category }) {
  const habit = {
    id: generateId("habit"),
    name,
    unit,
    color,
    icon,
    treeType,
    category,
    missions,
    frequency: "daily",
    createdAt: new Date().toISOString(),
  };
  setState({ habits: [...getHabits(), habit] });
  return habit;
}

export function removeHabit(id) {
  setState({ habits: getHabits().filter((habit) => habit.id !== id) });
}
