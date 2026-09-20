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
  guardianName = null,
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
    // O nome que a pessoa deu ao guardião. Null mantém o nome da espécie
    // (Raposa, Axolote...) — batizar é opcional, nunca obrigatório.
    guardianName,
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

/*
  A ordem da lista é a própria ordem de habits[] — ninguém reordena por
  importância, horário ou nome em lugar nenhum do app. Por isso reordenar à
  mão aqui já basta: a missão do dia, a lista em Meus hábitos e as posições
  no Lar e no Jardim seguem essa mesma ordem sozinhas.
*/
export function reorderHabits(orderedIds) {
  const byId = new Map(getHabits().map((habit) => [habit.id, habit]));
  const reordered = orderedIds.map((id) => byId.get(id)).filter(Boolean);
  // Um hábito fora da lista recebida (não deveria acontecer) fica no fim,
  // em vez de sumir da lista por causa de uma ordem incompleta.
  const incluidos = new Set(orderedIds);
  const resto = getHabits().filter((habit) => !incluidos.has(habit.id));
  setState({ habits: [...reordered, ...resto] });
}
