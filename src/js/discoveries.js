// Disponibilidade e coleta dos achados.
//
// Diferente do resto do app, o que já foi coletado precisa ser guardado: é uma
// ação da pessoa, não uma leitura do histórico. O que é derivado é o direito
// de coletar — o achado só aparece quando a atividade real destravou.

import { getState, setState } from "./state.js";
import { evaluateGoal } from "./quests.js";
import { DISCOVERIES } from "../data/discoveries.js";

export function getCollected() {
  return getState().collected;
}

export function isCollected(id) {
  return getCollected().some((item) => item.id === id);
}

function fitsAnimal(discovery, animal) {
  return !discovery.element || discovery.element === animal?.element;
}

// Tudo que aquele hábito já destravou, coletado ou não.
export function getEarnedDiscoveries(habit, animal) {
  return DISCOVERIES.filter(
    (discovery) =>
      fitsAnimal(discovery, animal) && evaluateGoal(discovery.requires, habit).done
  );
}

// O que a criatura está segurando para te entregar agora.
export function getPendingDiscovery(habit, animal) {
  return getEarnedDiscoveries(habit, animal).find((discovery) => !isCollected(discovery.id)) || null;
}

export function collectDiscovery(discovery, habit) {
  if (isCollected(discovery.id)) return;
  setState({
    collected: [
      ...getCollected(),
      {
        id: discovery.id,
        habitId: habit.id,
        collectedAt: new Date().toISOString(),
      },
    ],
  });
}

export function getCollectionFor(habit, animal) {
  return getEarnedDiscoveries(habit, animal)
    .filter((discovery) => isCollected(discovery.id))
    .map((discovery) => ({
      ...discovery,
      collectedAt: getCollected().find((item) => item.id === discovery.id)?.collectedAt,
    }));
}
