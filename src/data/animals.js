// Catálogo de companheiros. Cada hábito tem o seu, e ele cresce com aquele
// hábito. Puro dado: quem desbloqueia o quê fica em companion.js.
//
// A cor é o único dado visual por animal — os tons derivados (brilho, glow)
// saem dela por color-mix, para o catálogo escalar até 100 sem inchar o CSS.
// A arte final de cada criatura entra depois, por assetKey.

/*
  Seis elementos, e cada um é uma área da vida.

  Não são só cores: o elemento é o eixo que o radar do Mestre mede. Por isso
  cada um carrega a área que representa (o que ele significa na vida real) e
  a essência (o que ele treina em você). Uma área sem nenhum hábito aparece
  vazia no radar — e isso é informação, não defeito.

  A ordem aqui é a ordem do radar, no sentido horário a partir do topo.
*/
export const ELEMENTS = {
  fogo: {
    id: "fogo",
    label: "Fogo",
    icon: "flame",
    area: "Corpo e energia",
    short: "Corpo",
    essence: "Vitalidade e força",
    color: "#ff7a3c",
  },
  agua: {
    id: "agua",
    label: "Água",
    icon: "droplet",
    area: "Emoções e descanso",
    short: "Emoções",
    essence: "Equilíbrio e fluxo",
    color: "#5fc2d9",
  },
  ar: {
    id: "ar",
    label: "Ar",
    icon: "wind",
    area: "Mente e clareza",
    short: "Mente",
    essence: "Foco e lucidez",
    color: "#9ec7e8",
  },
  terra: {
    id: "terra",
    label: "Terra",
    icon: "sprout",
    area: "Trabalho e ordem",
    short: "Trabalho",
    essence: "Estabilidade e constância",
    color: "#8fae5c",
  },
  luz: {
    id: "luz",
    label: "Luz",
    icon: "star",
    area: "Relações e conexão",
    short: "Relações",
    essence: "Afeto e presença",
    color: "#f2c14e",
  },
  espirito: {
    id: "espirito",
    label: "Espírito",
    icon: "spark",
    area: "Propósito e sentido",
    short: "Propósito",
    essence: "Significado e direção",
    color: "#b39ddb",
  },
};

// A ordem dos eixos do radar — declarada uma vez, para a roda não depender
// da ordem de declaração de um objeto.
export const ELEMENT_ORDER = ["fogo", "agua", "ar", "terra", "luz", "espirito"];

// Cada categoria de hábito alimenta um elemento. É isso que faz a coleção
// virar um retrato do que a pessoa realmente pratica.
export const CATEGORY_ELEMENT = {
  movimento: "fogo",
  corpo: "fogo",
  recuperacao: "agua",
  equilibrio: "agua",
  mente: "ar",
  trabalho: "terra",
  relacoes: "luz",
  proposito: "espirito",
};

export const CATEGORY_LABELS = {
  movimento: "movimento",
  corpo: "corpo",
  recuperacao: "descanso",
  equilibrio: "equilíbrio",
  mente: "mente",
  trabalho: "trabalho",
  relacoes: "relações",
  proposito: "propósito",
  custom: "livre",
};

/*
  starter: true → uma das três iniciais. Escolhe-se UMA no começo, e as
                  outras duas ficam perdidas para sempre: não há como
                  conquistá-las depois. É o que dá peso à escolha.
  unlock: {category, days} → pede tantos dias cumpridos em hábitos daquela
                  categoria (dias distintos, não registros), além do mínimo
                  de uma semana de jogo exigido de toda conquista.
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
    starter: true,
  },
  {
    id: "axolote",
    gender: "m",
    name: "Axolote",
    element: "agua",
    color: "#9b8cfa",
    tagline: "A calma que enxerga com clareza.",
    personality: "Sereno e observador. Ensina que descansar também é progresso.",
    starter: true,
  },
  {
    id: "capivara",
    gender: "f",
    name: "Capivara",
    element: "terra",
    color: "#8fae5c",
    tagline: "A raiz que sustenta cada dia.",
    personality: "Constante e paciente. Constrói devagar o que dura para sempre.",
    starter: true,
  },
  {
    id: "vagalume",
    gender: "m",
    name: "Vagalume",
    element: "ar",
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
    element: "fogo",
    color: "#b08d57",
    tagline: "Couraça de quem cuida do próprio corpo.",
    personality: "Cava fundo e se protege. Cuidar de si é uma forma de armadura.",
    unlock: { category: "corpo", days: 25 },
  },
  {
    id: "ourico",
    gender: "m",
    name: "Ouriço",
    element: "agua",
    color: "#7d9b6a",
    tagline: "Quem aprendeu a se recolher sem se fechar.",
    personality: "Encontra equilíbrio entre proteger-se e continuar andando.",
    unlock: { category: "equilibrio", days: 40 },
  },
  {
    id: "coruja",
    gender: "f",
    name: "Coruja",
    element: "ar",
    color: "#c3b8e8",
    tagline: "Enxerga o que o cansaço esconde.",
    personality: "Guarda o que aprendeu. Onde havia dúvida, agora há repertório.",
    unlock: { category: "mente", days: 30 },
  },
  {
    id: "lontra",
    gender: "f",
    name: "Lontra",
    element: "luz",
    color: "#f2c14e",
    tagline: "Não solta a mão de quem gosta.",
    personality: "Dorme de mãos dadas para não se perder na correnteza. Sozinha ela flutua; junto, ela brinca.",
    unlock: { category: "relacoes", days: 15 },
  },
  {
    id: "cervo",
    gender: "m",
    name: "Cervo",
    element: "espirito",
    color: "#b39ddb",
    tagline: "Sabe para onde vai, mesmo devagar.",
    personality: "Anda em silêncio e sem pressa. Os chifres crescem como galhos: o tempo trabalha a favor dele.",
    unlock: { category: "proposito", days: 15 },
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
