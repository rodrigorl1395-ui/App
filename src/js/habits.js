// Regras de negócio dos hábitos. Não toca no DOM: só lê e escreve estado.

import { getState, setState } from "./state.js";
import { generateId } from "./utils.js";

export function getHabits() {
  return getState().habits;
}

export function createHabit({ name, unit, color, icon, treeType, missions, category, animalId }) {
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
    frequency: "daily",
    createdAt: new Date().toISOString(),
  };
  setState({ habits: [...getHabits(), habit] });
  return habit;
}

/*
  Passar um hábito para outra criatura: é o que dá uso a quem foi conquistada.
  Antes de trocar, carimbamos os registros antigos com quem cuidava até agora
  — sem isso o esforço já feito migraria junto e a criatura nova chegaria
  pronta no nível de quem suou por ele.
*/
export function setHabitAnimal(habitId, animalId) {
  const state = getState();
  const previousAnimalId = state.habits.find((habit) => habit.id === habitId)?.animalId;

  setState({
    logs: state.logs.map((log) =>
      log.habitId === habitId && !log.animalId ? { ...log, animalId: previousAnimalId } : log
    ),
    habits: state.habits.map((habit) =>
      habit.id === habitId ? { ...habit, animalId } : habit
    ),
  });
}

export function removeHabit(id) {
  setState({ habits: getHabits().filter((habit) => habit.id !== id) });
}
