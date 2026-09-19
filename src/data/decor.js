/*
  Catálogo do jardim: itens puramente decorativos, trocados por sementes.

  Nada aqui dá XP, mexe em vigor, sequência ou desbloqueio. É um segundo
  circuito de recompensa por cima do que já existe — nunca dentro dele. A
  árvore de cada hábito continua sendo a única fonte de progresso real;
  estas são só as que o Mestre planta para o Lar ficar mais bonito.

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
    color: "#c9a26a",
    scale: 0.85,
    story: "Pequena, mas de pé. Todo jardim começa com um teto.",
  },
  {
    id: "casa-de-pedra",
    kind: "morada",
    name: "Casa de Pedra",
    cost: 5,
    color: "#9aa0ab",
    scale: 1.05,
    story: "Mais firme que a cabana. Leva tempo para erguer uma assim.",
  },
  {
    id: "torre-pequena",
    kind: "morada",
    name: "Torre Pequena",
    cost: 9,
    color: "#8a7ca8",
    scale: 1.25,
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
