// Biblioteca da Jornada: as missões que a criatura propõe ao longo do tempo.
//
// Não confundir com a missão do dia (mínima, principal e bônus), que é o
// tamanho do passo de hoje. Estas aqui têm nome, história e etapas, e se
// conquistam ao longo de semanas.
//
// {animal} é trocado pelo nome da criatura no texto.
//
// goal / etapas usam os mesmos tipos, avaliados sempre a partir dos registros:
//   dias        → dias distintos cumpridos
//   sequencia   → melhor sequência já alcançada
//   quantidade  → soma dos valores registrados
//   bonus       → vezes que a missão bônus saiu
//   lembrancas  → lembranças guardadas
//   combinados  → vezes que a pessoa combinou antes de fazer
//   retorno     → voltar depois de faltar dois dias ou mais
//
// reserve é o caminho alternativo: quando a sequência quebra, a missão reserva
// mantém a jornada viva em vez de zerar tudo. Conquistar por ela vale.

export const QUESTS = [
  {
    id: "primeiro-passo",
    name: "O Primeiro Passo",
    story:
      "{animal} não quer saber do seu melhor dia. Quer saber do primeiro. Mostre a ela que isto existe fora da sua cabeça.",
    goal: { type: "dias", amount: 1 },
    steps: [
      { text: "Combinar onde e quando", goal: { type: "combinados", amount: 1 } },
      { text: "Cumprir a missão de hoje", goal: { type: "dias", amount: 1 } },
    ],
    reward: "{animal} passa a confiar que você volta.",
  },
  {
    id: "tres-brasas",
    name: "Três Brasas",
    story:
      "Uma vez é acaso. Três seguidas é intenção. {animal} vai ficar de olho nas três.",
    goal: { type: "sequencia", amount: 3 },
    steps: [
      { text: "Dois dias seguidos", goal: { type: "sequencia", amount: 2 } },
      { text: "Três dias seguidos", goal: { type: "sequencia", amount: 3 } },
    ],
    reserve: {
      name: "Três Fagulhas",
      story:
        "A sequência quebrou, e tudo bem. Três dias na mesma semana continuam valendo — o que conta é voltar.",
      goal: { type: "dias", amount: 3 },
    },
    reward: "A primeira prova de que não foi sorte.",
  },
  {
    id: "dia-dificil",
    name: "O Dia Difícil",
    story:
      "Algum dia você vai faltar. A missão não é nunca faltar: é voltar depois. {animal} espera sem cobrar.",
    goal: { type: "retorno", amount: 1 },
    steps: [{ text: "Voltar depois de faltar", goal: { type: "retorno", amount: 1 } }],
    reward: "Você aprendeu a parte que quase todo mundo pula.",
  },
  {
    id: "semana-inteira",
    name: "A Semana Inteira",
    story:
      "Sete dias cumpridos. Não precisam ser seguidos — precisam ser seus.",
    goal: { type: "dias", amount: 7 },
    steps: [
      { text: "Três dias cumpridos", goal: { type: "dias", amount: 3 } },
      { text: "Cinco dias cumpridos", goal: { type: "dias", amount: 5 } },
      { text: "Sete dias cumpridos", goal: { type: "dias", amount: 7 } },
    ],
    reserve: {
      name: "Meia Semana",
      story: "Cinco dias já mudam uma semana. {animal} aceita cinco.",
      goal: { type: "dias", amount: 5 },
    },
    reward: "{animal} desperta de vez.",
  },
  {
    id: "memoria-guardada",
    name: "A Memória Guardada",
    story:
      "Fazer é metade. A outra metade é lembrar por que valeu. Guarde três lembranças e {animal} passa a carregá-las.",
    goal: { type: "lembrancas", amount: 3 },
    steps: [
      { text: "Primeira lembrança guardada", goal: { type: "lembrancas", amount: 1 } },
      { text: "Três lembranças guardadas", goal: { type: "lembrancas", amount: 3 } },
    ],
    reward: "Seus frutos começam a contar a sua história.",
  },
  {
    id: "alem-do-combinado",
    name: "Além do Combinado",
    story:
      "Tem dia que sobra. Nesses, vá além do que você prometeu — três vezes, para {animal} ver do que você é capaz quando quer.",
    goal: { type: "bonus", amount: 3 },
    steps: [
      { text: "Uma missão bônus", goal: { type: "bonus", amount: 1 } },
      { text: "Três missões bônus", goal: { type: "bonus", amount: 3 } },
    ],
    reserve: {
      name: "Uma Vez Além",
      story: "Uma vez acima do combinado já conta. O resto vem.",
      goal: { type: "bonus", amount: 1 },
    },
    reward: "O teto de ontem virou o chão de hoje.",
  },
  {
    id: "dez-dias",
    name: "Dez Dias de Pé",
    story:
      "Dez dias seguidos. É aqui que o hábito para de depender da sua vontade e passa a depender da sua rotina.",
    goal: { type: "sequencia", amount: 10 },
    steps: [
      { text: "Cinco dias seguidos", goal: { type: "sequencia", amount: 5 } },
      { text: "Dez dias seguidos", goal: { type: "sequencia", amount: 10 } },
    ],
    reserve: {
      name: "Dez Dias Espalhados",
      story: "Dez dias cumpridos, seguidos ou não. A conta é a mesma no fim do mês.",
      goal: { type: "dias", amount: 10 },
    },
    reward: "{animal} chega à forma treinada.",
  },
  {
    id: "mes-de-raizes",
    name: "Um Mês de Raízes",
    story:
      "Trinta dias cumpridos. A essa altura você não está tentando um hábito — você tem um.",
    goal: { type: "dias", amount: 30 },
    steps: [
      { text: "Quinze dias cumpridos", goal: { type: "dias", amount: 15 } },
      { text: "Trinta dias cumpridos", goal: { type: "dias", amount: 30 } },
    ],
    reserve: {
      name: "Vinte Dias",
      story: "Vinte dias num mês é mais do que a maioria consegue. Conta.",
      goal: { type: "dias", amount: 20 },
    },
    reward: "O guardião e a pessoa mudaram juntas.",
  },
];

// O placeholder se chama {animal} por herança; o que sai dele é sempre o
// nome do guardião — e, na falta dele, a palavra guardião mesmo.
export function fillNames(text, animalName) {
  return text.replaceAll("{animal}", animalName || "Seu guardião");
}
