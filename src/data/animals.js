// Definições estáticas dos animais-companheiro. Puro dado, sem lógica.
// A personalidade de cada um mapeia para um estilo de progresso diferente,
// mas todos evoluem em todas as áreas — a escolha é emocional, não uma build.

export const ANIMALS = [
  {
    id: "raposa",
    name: "Raposa",
    element: "fogo",
    elementLabel: "Fogo",
    companionOf: "Companheira do fogo",
    tagline: "A faísca que te coloca em movimento.",
    personality:
      "Impulsiva, corajosa, cheia de energia. Não espera o momento perfeito — ela cria o momento.",
    traits: ["Energia", "Iniciativa", "Coragem"],
  },
  {
    id: "axolote",
    name: "Axolote",
    element: "agua",
    elementLabel: "Água",
    companionOf: "Companheiro da água",
    tagline: "A calma que enxerga com clareza.",
    personality:
      "Serena, observadora, regenera-se com facilidade. Ensina que descansar também é progresso.",
    traits: ["Foco", "Calma", "Recuperação"],
  },
  {
    id: "capivara",
    name: "Capivara",
    element: "terra",
    elementLabel: "Terra",
    companionOf: "Companheira da terra",
    tagline: "A raiz que sustenta cada dia.",
    personality:
      "Constante, paciente, inabalável. Constrói devagar o que dura para sempre.",
    traits: ["Constância", "Resiliência", "Equilíbrio"],
  },
];

export function getAnimalById(id) {
  return ANIMALS.find((animal) => animal.id === id) || null;
}
