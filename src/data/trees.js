// Tipos de árvore que cada hábito planta no jardim.
// Os estágios visuais de crescimento entram junto com o jardim (fase futura);
// por enquanto isto é só a identidade de cada árvore.

export const TREE_TYPES = {
  resistencia: { id: "resistencia", name: "Árvore da Resistência" },
  conhecimento: { id: "conhecimento", name: "Árvore do Conhecimento" },
  ancestral: { id: "ancestral", name: "Árvore Ancestral" },
  bonsai: { id: "bonsai", name: "Bonsai" },
  noturna: { id: "noturna", name: "Árvore Noturna" },
  frutifera: { id: "frutifera", name: "Árvore Frutífera" },
  comum: { id: "comum", name: "Muda do seu jeito" },
};

export function getTreeType(id) {
  return TREE_TYPES[id] || TREE_TYPES.comum;
}
