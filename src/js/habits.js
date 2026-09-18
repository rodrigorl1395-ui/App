// Regras de negócio dos hábitos. Não toca no DOM: só lê e escreve estado.

import { getState, setState } from "./state.js";
import { generateId } from "./utils.js";

export function getHabits() {
  return getState().habits;
}

export function createHabit({
  name,
  unit,
  color,
  icon,
  treeType,
  missions,
  category,
  animalId,
  weeklyTarget = 7,
}) {
  const habit = {
    id: generateId("habit"),
    name,
    unit,
    color,
    icon,
    treeType,
    category,
    animalId,
    missions,
    // Quantos dias por semana a pessoa se compromete — é a base do progresso
    // semanal e evita tratar como falha um dia que nunca foi planejado.
    weeklyTarget,
    createdAt: new Date().toISOString(),
  };
  setState({ habits: [...getHabits(), habit] });
  return habit;
}

// Altera só os campos passados; o histórico daquele hábito segue intacto.
export function updateHabit(id, changes) {
  setState({
    habits: getHabits().map((habit) => (habit.id === id ? { ...habit, ...changes } : habit)),
  });
}

export function removeHabit(id) {
  setState({ habits: getHabits().filter((habit) => habit.id !== id) });
}
