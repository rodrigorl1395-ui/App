// Tipos de árvore e seus estágios. A árvore é o habitat da criatura daquele
// hábito: as duas crescem com o mesmo esforço, em vez de serem duas barras
// de progresso competindo.

/*
  guardianOf completa o título da criatura ("Guardiã da Resistência"). Vem da
  árvore, e não do nome que a pessoa digitou, porque aqui o gênero e a
  preposição são nossos — "Guardiã de Ir à academia" não existe em português.
*/
export const TREE_TYPES = {
  resistencia: { id: "resistencia", name: "Árvore da Resistência", guardianOf: "da Resistência", leaf: "#7fb069" },
  conhecimento: { id: "conhecimento", name: "Árvore do Conhecimento", guardianOf: "do Conhecimento", leaf: "#6db3f2" },
  ancestral: { id: "ancestral", name: "Árvore Ancestral", guardianOf: "do Saber", leaf: "#9b8cfa" },
  bonsai: { id: "bonsai", name: "Bonsai", guardianOf: "do Equilíbrio", leaf: "#6fae8f" },
  noturna: { id: "noturna", name: "Árvore Noturna", guardianOf: "do Descanso", leaf: "#8a8fd9" },
  frutifera: { id: "frutifera", name: "Árvore Frutífera", guardianOf: "do Cuidado", leaf: "#e0705f" },
  cedro: { id: "cedro", name: "Cedro do Ofício", guardianOf: "do Ofício", leaf: "#a3b18a" },
  florada: { id: "florada", name: "Árvore em Flor", guardianOf: "do Afeto", leaf: "#f0c987" },
  sagrada: { id: "sagrada", name: "Árvore Sagrada", guardianOf: "do Sentido", leaf: "#b39ddb" },
  comum: { id: "comum", name: "Muda do seu jeito", guardianOf: "do seu Caminho", leaf: "#8fae5c" },
};

// Os limiares acompanham os estágios da criatura: quando ela evolui, o
// habitat dela muda junto.
export const TREE_STAGES = [
  { stage: 0, name: "Semente", minXp: 0 },
  { stage: 1, name: "Broto", minXp: 25 },
  { stage: 2, name: "Muda", minXp: 100 },
  { stage: 3, name: "Árvore jovem", minXp: 300 },
  { stage: 4, name: "Árvore adulta", minXp: 700 },
  { stage: 5, name: "Em flor", minXp: 1400 },
  { stage: 6, name: "Dando frutos", minXp: 2500 },
];

export function getTreeType(id) {
  return TREE_TYPES[id] || TREE_TYPES.comum;
}

export function getTreeStage(xp) {
  return TREE_STAGES.reduce((current, stage) => (xp >= stage.minXp ? stage : current), TREE_STAGES[0]);
}
