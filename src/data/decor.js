/*
  Catálogo de enfeites do jardim antigo — APOSENTADO.

  Quando o jardim virou jogo de jardinagem de verdade (garden/grove.js),
  plantar enfeite com semente deixou de existir: agora se planta muda, rega
  e colhe. Este arquivo continua aqui por um motivo só — seeds.js recalcula
  o quanto já foi gasto lendo estes preços, e apagá-lo devolveria sementes
  para quem gastou antes. Não é para crescer nem ganhar item novo.

  cost mora aqui, e não em campo próprio: o preço de um item já plantado é
  recalculado deste catálogo sempre que se precisa saber o quanto foi gasto
  — se um dia o preço mudar, o histórico de gastos muda com ele, coerente.
*/

export const DECOR_ITEMS = [
  {
    id: "cabana-simples",
    kind: "morada",
    name: "Cabana Simples",
    cost: 2,
    scale: 0.85,
    story: "Pequena, mas de pé. Todo jardim começa com um teto.",
  },
  {
    id: "casa-de-pedra",
    kind: "morada",
    name: "Casa de Pedra",
    cost: 5,
    scale: 1,
    story: "Mais firme que a cabana. Leva tempo para erguer uma assim.",
  },
  {
    id: "torre-pequena",
    kind: "morada",
    name: "Torre Pequena",
    cost: 9,
    scale: 1.1,
    story: "Vê o jardim inteiro daqui de cima.",
  },
  {
    id: "cerejeira",
    kind: "arvore",
    name: "Cerejeira",
    cost: 3,
    color: "#f2a6c2",
    story: "Não dá fruto que se coma. Dá só o motivo de olhar.",
  },
  {
    id: "carvalho-antigo",
    kind: "arvore",
    name: "Carvalho Antigo",
    cost: 6,
    color: "#7a9b5c",
    story: "Estava aqui antes de qualquer hábito seu. Vai continuar depois.",
  },
  {
    id: "salgueiro",
    kind: "arvore",
    name: "Salgueiro-Chorão",
    cost: 8,
    color: "#8fae8a",
    story: "Balança mesmo sem vento. Alguma coisa por dentro se move.",
  },
];

export function getDecorItem(id) {
  return DECOR_ITEMS.find((item) => item.id === id) || null;
}
