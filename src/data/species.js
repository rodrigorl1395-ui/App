/*
  As espécies do jardim — nove árvores brasileiras.

  Diferente dos guardiões, que são um por hábito, aqui a espécie vem da
  CATEGORIA: quem tem um hábito de movimento ganha o direito de plantar
  coqueiro, quem tem um de mente ganha o ipê. A árvore não representa um
  hábito específico e não se entra nela pra ver histórico nenhum — ela é uma
  planta, e o que se faz com planta é cuidar.

  rate  multiplica o quanto cada rega faz crescer. A jabuticabeira é lenta
        de propósito (na vida real leva anos pra dar o primeiro fruto); o
        bambu é o mais rápido que existe.
  yield quantos frutos cada colheita rende.
*/

export const SPECIES = [
  {
    id: "coqueiro",
    name: "Coqueiro",
    category: "movimento",
    leaf: "#43a047",
    fruit: "#8d6e63",
    fruitName: "cocos",
    rate: 1,
    yield: 4,
    story: "Cresce torto atrás do sol e não cai. É o que o corpo aprende quando insiste.",
  },
  {
    id: "mangueira",
    name: "Mangueira",
    category: "corpo",
    leaf: "#2e7d32",
    fruit: "#fb8c00",
    fruitName: "mangas",
    rate: 1,
    yield: 6,
    story: "A sombra dela é onde o Brasil inteiro descansa. Dá fruto demais pra quem plantou sozinho.",
  },
  {
    id: "jabuticabeira",
    name: "Jabuticabeira",
    category: "recuperacao",
    leaf: "#388e3c",
    fruit: "#1a0d1f",
    fruitName: "jabuticabas",
    rate: 0.7,
    yield: 9,
    story: "Demora anos pra dar o primeiro fruto, e aí dá no tronco inteiro. Quem espera, come.",
  },
  {
    id: "bambuzal",
    name: "Bambuzal",
    category: "equilibrio",
    leaf: "#7cb342",
    fruit: "#c0ca33",
    fruitName: "colmos",
    rate: 1.5,
    yield: 5,
    story: "Verga no temporal e volta. Não quebra porque não tenta ficar duro.",
  },
  {
    id: "ipe",
    name: "Ipê-amarelo",
    category: "mente",
    leaf: "#558b2f",
    fruit: "#fdd835",
    fruitName: "flores",
    rate: 0.9,
    yield: 3,
    story: "Larga todas as folhas pra florir. Clareza custa soltar o que estava ocupando espaço.",
  },
  {
    id: "cafeeiro",
    name: "Cafeeiro",
    category: "trabalho",
    leaf: "#33691e",
    fruit: "#d32f2f",
    fruitName: "grãos",
    rate: 1.1,
    yield: 7,
    story: "Dá em cacho, o ano todo, sem espetáculo. Trabalho é isso: render no ordinário.",
  },
  {
    id: "maracuja",
    name: "Maracujá",
    category: "relacoes",
    leaf: "#66bb6a",
    fruit: "#fdd835",
    fruitName: "maracujás",
    rate: 1.2,
    yield: 6,
    story: "Só sobe se tiver em que se apoiar. Sozinha ela rasteja; com treliça, cobre tudo.",
  },
  {
    id: "jequitiba",
    name: "Jequitibá",
    category: "proposito",
    leaf: "#1b5e20",
    fruit: "#a1887f",
    fruitName: "sementes",
    rate: 0.6,
    yield: 2,
    story: "Passa de mil anos em pé. Não tem pressa porque sabe exatamente pra onde está indo.",
  },
  {
    id: "pitangueira",
    name: "Pitangueira",
    category: "custom",
    leaf: "#4caf50",
    fruit: "#e53935",
    fruitName: "pitangas",
    rate: 1.2,
    yield: 6,
    story: "Nasce em quintal, sem ninguém plantar. Do seu jeito, no seu canto.",
  },
];

/*
  Os sete degraus. A rega padrão vale 10 pontos, então sair da semente e
  chegar ao primeiro fruto leva umas dezenove regas — semanas de cuidado, não
  uma tarde. É o mesmo peso que a evolução do guardião tem.
*/
export const PLANT_STAGES = [
  { stage: 0, name: "Semente", min: 0 },
  { stage: 1, name: "Broto", min: 10 },
  { stage: 2, name: "Muda", min: 25 },
  { stage: 3, name: "Jovem", min: 50 },
  { stage: 4, name: "Adulta", min: 85 },
  { stage: 5, name: "Em flor", min: 130 },
  { stage: 6, name: "Frutificando", min: 185 },
];

// Colher devolve a planta ao início da floração: ela volta a dar fruto em
// poucas regas, em vez de recomeçar da semente. Cuidar rende sempre.
export const REPLANT_GROWTH = PLANT_STAGES[5].min;

export const SPECIES_BY_CATEGORY = Object.fromEntries(
  SPECIES.map((especie) => [especie.category, especie.id])
);

export function getSpecies(id) {
  return SPECIES.find((especie) => especie.id === id) || SPECIES[0];
}

export function getPlantStage(growth) {
  return PLANT_STAGES.reduce((atual, degrau) => (growth >= degrau.min ? degrau : atual), PLANT_STAGES[0]);
}

// Quanto falta para o próximo degrau, de 0 a 1. No último, cheio.
export function getStageProgress(growth) {
  const atual = getPlantStage(growth);
  const proximo = PLANT_STAGES.find((degrau) => degrau.min > growth);
  if (!proximo) return { stage: atual, next: null, progress: 1 };
  return { stage: atual, next: proximo, progress: (growth - atual.min) / (proximo.min - atual.min) };
}
