// Modelos de hábito sugeridos na criação. São apenas pontos de partida:
// o usuário pode alterar qualquer campo antes de salvar.
// missions guarda as três metas do dia — mínima, principal e bônus.

export const HABIT_TEMPLATES = [
  {
    id: "corrida",
    name: "Correr",
    category: "movimento",
    icon: "flame",
    color: "#ff7a3c",
    unit: "min",
    treeType: "resistencia",
    missions: { minimal: 5, main: 30, bonus: 45 },
  },
  {
    id: "leitura",
    name: "Ler",
    category: "mente",
    icon: "book",
    color: "#6db3f2",
    unit: "páginas",
    treeType: "conhecimento",
    missions: { minimal: 2, main: 15, bonus: 30 },
  },
  {
    id: "estudo",
    name: "Estudar",
    category: "mente",
    icon: "star",
    color: "#9b8cfa",
    unit: "min",
    treeType: "ancestral",
    missions: { minimal: 10, main: 45, bonus: 90 },
  },
  {
    id: "meditacao",
    name: "Meditar",
    category: "equilibrio",
    icon: "sprout",
    color: "#6fae8f",
    unit: "min",
    treeType: "bonsai",
    missions: { minimal: 2, main: 10, bonus: 20 },
  },
  {
    id: "sono",
    name: "Dormir melhor",
    category: "recuperacao",
    icon: "moon",
    color: "#8a8fd9",
    unit: "horas",
    treeType: "noturna",
    missions: { minimal: 6, main: 7, bonus: 8 },
  },
  {
    id: "alimentacao",
    name: "Comer bem",
    category: "corpo",
    icon: "apple",
    color: "#e0705f",
    unit: "porções",
    treeType: "frutifera",
    missions: { minimal: 1, main: 3, bonus: 5 },
  },
];

export const CUSTOM_TEMPLATE = {
  id: "custom",
  name: "",
  category: "custom",
  icon: "sprout",
  color: "#d99a4e",
  unit: "vezes",
  treeType: "comum",
  missions: { minimal: 1, main: 3, bonus: 5 },
};
