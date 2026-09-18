// Escada de evolução do companheiro.
// Os limiares são propositalmente altos: cumprindo a missão principal de um
// hábito por dia (25 XP), Desperto chega em ~4 dias, Treinado em ~12 e a
// Forma Lendária em ~100. A evolução representa semanas de esforço real.

export const STAGES = [
  { stage: 1, name: "Companheiro inicial", minXp: 0 },
  { stage: 2, name: "Desperto", minXp: 100 },
  { stage: 3, name: "Treinado", minXp: 300 },
  { stage: 4, name: "Evoluído", minXp: 700 },
  { stage: 5, name: "Avançado", minXp: 1400 },
  { stage: 6, name: "Forma lendária", minXp: 2500 },
];

export function getStage(xp) {
  return STAGES.reduce((current, stage) => (xp >= stage.minXp ? stage : current), STAGES[0]);
}

export function getNextStage(xp) {
  return STAGES.find((stage) => stage.minXp > xp) || null;
}

// Fração de 0 a 1 do caminho até o próximo estágio. Na forma final, 1.
export function getStageProgress(xp) {
  const current = getStage(xp);
  const next = getNextStage(xp);
  if (!next) return 1;
  return (xp - current.minXp) / (next.minXp - current.minXp);
}
