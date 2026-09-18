// Catálogo de companheiros. Cada hábito tem o seu, e ele cresce com aquele
// hábito. Puro dado: quem desbloqueia o quê fica em companion.js.
//
// A cor é o único dado visual por animal — os tons derivados (brilho, glow)
// saem dela por color-mix, para o catálogo escalar até 100 sem inchar o CSS.
// A arte final de cada criatura entra depois, por assetKey.

export const ELEMENTS = {
  fogo: { id: "fogo", label: "Fogo", icon: "flame" },
  agua: { id: "agua", label: "Água", icon: "droplet" },
  terra: { id: "terra", label: "Terra", icon: "sprout" },
  luz: { id: "luz", label: "Luz", icon: "star" },
};

// Cada categoria de hábito alimenta um elemento. É isso que faz a coleção
// virar um retrato do que a pessoa realmente pratica.
export const CATEGORY_ELEMENT = {
  movimento: "fogo",
  recuperacao: "agua",
  corpo: "terra",
  equilibrio: "terra",
  mente: "luz",
};

export const CATEGORY_LABELS = {
  movimento: "movimento",
  recuperacao: "recuperação",
  corpo: "corpo",
  equilibrio: "equilíbrio",
  mente: "mente",
  custom: "livre",
};

/*
  unlock: null       → disponível desde o começo
  unlock: {category, days} → pede tantos dias cumpridos em hábitos daquela
                             categoria (dias distintos, não registros)
*/
export const ANIMALS = [
  {
    id: "raposa",
    gender: "f",
    name: "Raposa",
    element: "fogo",
    color: "#ff7a3c",
    tagline: "A faísca que te coloca em movimento.",
    personality: "Impulsiva e corajosa. Não espera o momento perfeito — ela cria o momento.",
    unlock: null,
  },
  {
    id: "axolote",
    gender: "m",
    name: "Axolote",
    element: "agua",
    color: "#9b8cfa",
    tagline: "A calma que enxerga com clareza.",
    personality: "Sereno e observador. Ensina que descansar também é progresso.",
    unlock: null,
  },
  {
    id: "capivara",
    gender: "f",
    name: "Capivara",
    element: "terra",
    color: "#8fae5c",
    tagline: "A raiz que sustenta cada dia.",
    personality: "Constante e paciente. Constrói devagar o que dura para sempre.",
    unlock: null,
  },
  {
    id: "vagalume",
    gender: "m",
    name: "Vagalume",
    element: "luz",
    color: "#e8d35f",
    tagline: "A primeira luz de quem estuda no escuro.",
    personality: "Pequeno e teimoso. Brilha mesmo quando ninguém está vendo.",
    unlock: { category: "mente", days: 10 },
  },
  {
    id: "salamandra",
    gender: "f",
    name: "Salamandra",
    element: "fogo",
    color: "#e2543f",
    tagline: "Quem atravessa o fogo sem se apagar.",
    personality: "Resistente ao desconforto. Vive onde os outros desistem.",
    unlock: { category: "movimento", days: 25 },
  },
  {
    id: "tartaruga",
    gender: "f",
    name: "Tartaruga",
    element: "agua",
    color: "#4fb3c9",
    tagline: "A prova de que devagar também chega.",
    personality: "Carrega a própria casa. Nunca teve pressa e nunca ficou para trás.",
    unlock: { category: "recuperacao", days: 25 },
  },
  {
    id: "tatu",
    gender: "m",
    name: "Tatu",
    element: "terra",
    color: "#b08d57",
    tagline: "Couraça de quem cuida do próprio corpo.",
    personality: "Cava fundo e se protege. Cuidar de si é uma forma de armadura.",
    unlock: { category: "corpo", days: 25 },
  },
  {
    id: "ourico",
    gender: "m",
    name: "Ouriço",
    element: "terra",
    color: "#7d9b6a",
    tagline: "Quem aprendeu a se recolher sem se fechar.",
    personality: "Encontra equilíbrio entre proteger-se e continuar andando.",
    unlock: { category: "equilibrio", days: 40 },
  },
  {
    id: "coruja",
    gender: "f",
    name: "Coruja",
    element: "luz",
    color: "#c3b8e8",
    tagline: "Enxerga o que o cansaço esconde.",
    personality: "Guarda o que aprendeu. Onde havia dúvida, agora há repertório.",
    unlock: { category: "mente", days: 30 },
  },
  {
    id: "lince",
    gender: "m",
    name: "Lince",
    element: "fogo",
    color: "#f0a04b",
    tagline: "Precisão de quem treinou muito tempo.",
    personality: "Não desperdiça movimento. Cada passo tem intenção.",
    unlock: { category: "movimento", days: 60 },
  },
];

export function getAnimalById(id) {
  return ANIMALS.find((animal) => animal.id === id) || null;
}

export function getElement(id) {
  return ELEMENTS[id] || ELEMENTS.terra;
}
