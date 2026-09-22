/*
  O que cada guardião faz no jardim, e qual app ele traz consigo.

  Os guardiões deixaram de ser enfeite do jardim: cada um trabalha na árvore
  da área dele, e o trabalho é o do seu elemento — água rega, ar poliniza,
  fogo queima a praga, luz nutre, terra aduba, espírito abençoa. Ninguém faz
  a mesma coisa com outro nome.

  Todo guardião trabalha sozinho uma vez por dia. Você pode, em vez disso,
  pedir a ação — aí você escolhe a árvore e o efeito é bem maior. É a
  diferença entre o jardim andar sem você e o jardim andar com você.
*/

export const ELEMENT_WORK = {
  agua: {
    id: "regar",
    verb: "Regar",
    icon: "droplet",
    // O que o guardião faz sozinho, e o que faz quando você pede.
    auto: 6,
    asked: 16,
    autoText: "regou a árvore mais sedenta",
    askText: "Rega fundo a árvore que você escolher, sem gastar o seu regador.",
    story: "Onde ele passa, a terra bebe.",
  },
  ar: {
    id: "polinizar",
    verb: "Polinizar",
    icon: "wind",
    auto: 1,
    asked: 3,
    autoText: "levou pólen de uma árvore a outra",
    askText: "Carrega pólen. Juntando o bastante, nasce uma muda de graça num canteiro livre.",
    story: "Leva no vento o que a árvore sozinha não alcança.",
  },
  fogo: {
    id: "proteger",
    verb: "Proteger",
    icon: "flame",
    auto: 1,
    asked: 4,
    autoText: "espantou as larvas de uma árvore",
    askText: "Queima a praga da árvore e deixa ela imune por alguns dias.",
    story: "Larva nenhuma chega perto de quem vive no fogo.",
  },
  luz: {
    id: "nutrir",
    verb: "Nutrir",
    icon: "star",
    auto: 0.3,
    asked: 0.8,
    autoText: "aqueceu o jardim",
    askText: "Hoje cada rega faz a árvore crescer bem mais.",
    story: "O que ela toca cresce mais rápido do que devia.",
  },
  terra: {
    id: "adubar",
    verb: "Adubar",
    icon: "sprout",
    auto: 1,
    asked: 3,
    autoText: "revirou a terra de uma árvore",
    askText: "A próxima colheita daquela árvore rende frutos a mais.",
    story: "Conhece a terra por baixo, onde ninguém olha.",
  },
  espirito: {
    id: "abencoar",
    verb: "Abençoar",
    icon: "spark",
    auto: 2,
    asked: 8,
    autoText: "abençoou o jardim",
    askText: "Hoje o fruto que você der a um guardião vale bem mais.",
    story: "Sabe o que cada fruto vale antes de você saber.",
  },
};

export function getWork(element) {
  return ELEMENT_WORK[element] || ELEMENT_WORK.terra;
}

/*
  O app que cada guardião traz no primeiro dia.

  Conquistar um guardião abre a ferramenta dele na hora — não depois de uma
  semana de constância, não por sementes. É o que faz a escolha do inicial
  valer alguma coisa já no primeiro minuto: você não ganhou só um bicho,
  ganhou uma ferramenta que faz algo de verdade.

  A afinidade não é sorteio: a raposa que te põe em movimento abre a
  academia, o vagalume que estuda no escuro abre a leitura, o tatu que se
  protege guardando abre o cofrinho.
*/
export const GUARDIAN_APP = {
  raposa: "coach-academia",
  axolote: "foco-total",
  capivara: "agenda",
  vagalume: "apoiador-leitura",
  salamandra: "calculadora-calorias",
  tartaruga: "bullet-journal",
  tatu: "cofrinho",
  ourico: "despertador",
  coruja: "radar-compras",
  lontra: "pessoas",
  cervo: "metas",
  lince: "rotinas",
};

export function getGuardianApp(guardianId) {
  return GUARDIAN_APP[guardianId] || null;
}

// Quanto XP vale um fruto dado a um guardião. Três frutos valem menos que
// um dia cumprido (25 XP): alimentar acelera, nunca substitui.
export const XP_POR_FRUTO = 6;

// Pólen necessário para nascer uma muda espontânea.
export const POLEN_POR_MUDA = 5;

// Dias sem água até a praga aparecer, e quantos dias a proteção segura.
export const DIAS_ATE_PRAGA = 4;
export const DIAS_DE_IMUNIDADE = 3;
