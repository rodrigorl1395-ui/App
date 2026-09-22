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

  unlock: [regra, regra, ...] → uma lista de caminhos alternativos. Basta UM
                  se cumprir para o guardião aparecer — nenhum pertence a
                  uma área só, do jeito que o Diário de Descobertas descreve:
                  "um guardião de fogo pode ser encontrado por alguém que
                  estuda". Por isso cada um mantém o caminho óbvio (a
                  categoria que dá nome a ele) e ganha pelo menos um caminho
                  inesperado, que qualquer pessoa pode cumprir sem nunca ter
                  criado um hábito daquela categoria.

                  Tipos de regra (avaliados em companion.js):
                    categoria            dias distintos numa categoria
                    sequencia-categoria  melhor sequência numa categoria
                    sequencia-geral      melhor sequência em qualquer hábito
                    retorno              vezes que voltou depois de sumir
                    lembrancas           reflexões guardadas, em qualquer hábito
                    combinados           vezes que combinou onde/quando antes
                    bonus                vezes que cumpriu o nível bônus
                    equilibrio           elementos distintos praticados na semana

                  Além do mínimo de uma semana de jogo, exigido de toda
                  conquista.
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
    unlock: [
      { type: "categoria", category: "mente", amount: 10 },
      // Brilha mesmo sem plateia: também aparece para quem volta sozinho,
      // sem ninguém cobrando — em qualquer hábito.
      { type: "retorno", amount: 2 },
    ],
  },
  {
    id: "salamandra",
    gender: "f",
    name: "Salamandra",
    element: "fogo",
    color: "#e2543f",
    tagline: "Quem atravessa o fogo sem se apagar.",
    personality: "Resistente ao desconforto. Vive onde os outros desistem.",
    unlock: [
      { type: "categoria", category: "movimento", amount: 25 },
      // Vive onde os outros desistem: ir além do combinado, de novo e de
      // novo, em qualquer hábito.
      { type: "bonus", amount: 15 },
    ],
  },
  {
    id: "tartaruga",
    gender: "f",
    name: "Tartaruga",
    element: "agua",
    color: "#4fb3c9",
    tagline: "A prova de que devagar também chega.",
    personality: "Carrega a própria casa. Nunca teve pressa e nunca ficou para trás.",
    unlock: [
      { type: "categoria", category: "recuperacao", amount: 25 },
      // Devagar também chega: acumular lembranças, sem pressa, em qualquer
      // hábito.
      { type: "lembrancas", amount: 20 },
    ],
  },
  {
    id: "tatu",
    gender: "m",
    name: "Tatu",
    element: "fogo",
    color: "#b08d57",
    tagline: "Couraça de quem cuida do próprio corpo.",
    personality: "Cava fundo e se protege. Cuidar de si é uma forma de armadura.",
    unlock: [
      { type: "categoria", category: "corpo", amount: 25 },
      // Se protege: combina onde e quando antes de agir, em qualquer
      // hábito — a couraça de quem se prepara.
      { type: "combinados", amount: 12 },
    ],
  },
  {
    id: "ourico",
    gender: "m",
    name: "Ouriço",
    element: "agua",
    color: "#7d9b6a",
    tagline: "Quem aprendeu a se recolher sem se fechar.",
    personality: "Encontra equilíbrio entre proteger-se e continuar andando.",
    unlock: [
      { type: "categoria", category: "equilibrio", amount: 40 },
      // O nome dele é o próprio critério: praticar áreas diferentes na
      // mesma semana, sem que nenhuma domine as outras.
      { type: "equilibrio", amount: 3, days: 7 },
    ],
  },
  {
    id: "coruja",
    gender: "f",
    name: "Coruja",
    element: "ar",
    color: "#c3b8e8",
    tagline: "Enxerga o que o cansaço esconde.",
    personality: "Guarda o que aprendeu. Onde havia dúvida, agora há repertório.",
    unlock: [
      { type: "categoria", category: "mente", amount: 30 },
      // Guarda o que aprendeu: lembranças guardadas em qualquer hábito
      // também contam como repertório.
      { type: "lembrancas", amount: 15 },
    ],
  },
  {
    id: "lontra",
    gender: "f",
    name: "Lontra",
    element: "luz",
    color: "#f2c14e",
    tagline: "Não solta a mão de quem gosta.",
    personality: "Dorme de mãos dadas para não se perder na correnteza. Sozinha ela flutua; junto, ela brinca.",
    unlock: [
      { type: "categoria", category: "relacoes", amount: 15 },
      // Não solta a mão: combinar antes é um jeito de segurar um
      // compromisso, em qualquer hábito.
      { type: "combinados", amount: 10 },
    ],
  },
  {
    id: "cervo",
    gender: "m",
    name: "Cervo",
    element: "espirito",
    color: "#b39ddb",
    tagline: "Sabe para onde vai, mesmo devagar.",
    personality: "Anda em silêncio e sem pressa. Os chifres crescem como galhos: o tempo trabalha a favor dele.",
    unlock: [
      { type: "categoria", category: "proposito", amount: 15 },
      // Sabe pra onde vai: constância geral, em qualquer hábito, sem
      // precisar ser justamente em propósito.
      { type: "sequencia-geral", amount: 20 },
    ],
  },
  {
    id: "lince",
    gender: "m",
    name: "Lince",
    element: "fogo",
    color: "#f0a04b",
    tagline: "Precisão de quem treinou muito tempo.",
    personality: "Não desperdiça movimento. Cada passo tem intenção.",
    unlock: [
      { type: "categoria", category: "movimento", amount: 60 },
      // Cada passo tem intenção: uma sequência longa em qualquer hábito
      // é a mesma disciplina, só que fora do movimento.
      { type: "sequencia-geral", amount: 30 },
    ],
  },
  {
    id: "andorinha",
    gender: "f",
    name: "Andorinha",
    element: "ar",
    color: "#c7dcf0",
    tagline: "Sempre volta para o mesmo lugar.",
    personality: "Migra longe, mas nunca se perde do caminho de casa.",
    unlock: [
      { type: "categoria", category: "mente", amount: 15 },
      // Sempre volta: quem retoma depois de sumir conhece o mesmo caminho.
      { type: "retorno", amount: 3 },
    ],
  },
  {
    id: "toupeira",
    gender: "f",
    name: "Toupeira",
    element: "terra",
    color: "#7a6a54",
    tagline: "Cava um pouco todo dia até virar um túnel inteiro.",
    personality: "Não vê longe, mas sente o caminho debaixo dos pés.",
    unlock: [
      { type: "categoria", category: "trabalho", amount: 20 },
      // Um pouco todo dia: a mesma constância, em qualquer hábito.
      { type: "sequencia-geral", amount: 15 },
    ],
  },
  {
    id: "tamandua",
    gender: "m",
    name: "Tamanduá",
    element: "terra",
    color: "#5f5347",
    tagline: "Trabalho de formiga em formiga, sem pressa e sem parar.",
    personality: "Persistente até no que ninguém percebe. O resultado aparece depois.",
    unlock: [
      { type: "categoria", category: "trabalho", amount: 45 },
      // Sem parar: ir além do combinado é o mesmo tipo de persistência.
      { type: "bonus", amount: 20 },
    ],
  },
  {
    id: "beijaflor",
    gender: "m",
    name: "Beija-flor",
    element: "luz",
    color: "#f7b8d0",
    tagline: "Pequeno, rápido, e nunca longe de quem gosta.",
    personality: "Bate as asas o tempo todo só para ficar perto.",
    unlock: [
      { type: "categoria", category: "relacoes", amount: 8 },
      // Nunca longe: combinar antes é aparecer de propósito.
      { type: "combinados", amount: 6 },
    ],
  },
  {
    id: "coelho",
    gender: "f",
    name: "Coelha",
    element: "luz",
    color: "#f4d9a0",
    tagline: "Nunca dorme longe de quem faz parte da toca.",
    personality: "Vive em grupo por escolha, não por precisar.",
    unlock: [
      { type: "categoria", category: "relacoes", amount: 30 },
      // Vive em grupo: lembranças guardadas também são um jeito de manter
      // gente por perto.
      { type: "lembrancas", amount: 12 },
    ],
  },
  {
    id: "baleia",
    gender: "f",
    name: "Baleia",
    element: "espirito",
    color: "#7fa8c9",
    tagline: "Canta uma canção que atravessa o oceano inteiro.",
    personality: "Segue uma rota que só ela conhece, ano após ano.",
    unlock: [
      { type: "categoria", category: "proposito", amount: 30 },
      // Ano após ano: a mesma direção sustentada, em qualquer hábito.
      { type: "sequencia-geral", amount: 25 },
    ],
  },
  {
    id: "borboleta",
    gender: "f",
    name: "Borboleta",
    element: "espirito",
    color: "#d9a8e0",
    tagline: "Virou outra coisa sem deixar de ser ela mesma.",
    personality: "Sabe que mudar de forma faz parte do caminho, não é desvio dele.",
    unlock: [
      { type: "categoria", category: "proposito", amount: 8 },
      // Virou outra coisa: equilibrar áreas diferentes é a mesma
      // disposição para se transformar.
      { type: "equilibrio", amount: 4, days: 7 },
    ],
  },
];

export function getAnimalById(id) {
  return ANIMALS.find((animal) => animal.id === id) || null;
}

export function getElement(id) {
  return ELEMENTS[id] || ELEMENTS.terra;
}
