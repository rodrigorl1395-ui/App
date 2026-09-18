// O que a criatura diz. É o segundo motivo para abrir o app: o hábito é uma
// vez por dia, mas ela sempre tem algo a dizer sobre onde vocês estão.
//
// {animal} vira o nome dela. Nada aqui cobra nem culpa — mesmo a ausência é
// tratada com saudade.

export const LINES = {
  // Por horário, na primeira visita do dia
  manha: [
    "O dia mal começou. Dá tempo de tudo.",
    "Acordei antes de você. De novo.",
    "Manhã é quando a desculpa ainda não teve tempo de nascer.",
    "Você veio cedo. Isso diz alguma coisa.",
  ],
  tarde: [
    "Metade do dia foi. A outra metade ainda é sua.",
    "Passei a manhã aqui, mexendo em nada.",
    "Ainda dá. Sempre dá, até a hora de dormir.",
  ],
  noite: [
    "O dia está acabando. Não precisa ser perfeito, precisa ser feito.",
    "Gosto daqui à noite. Fica tudo mais quieto.",
    "Se sobrou pouco do dia, faça pouco. Conta igual.",
  ],

  // Por humor
  novo: [
    "Então é você. Vou ficar por aqui.",
    "Ainda não sei do que você é capaz. Estou curiosa.",
    "Primeira vez é sempre estranho. Depois vira caminho.",
  ],
  alegre: [
    "Hoje já foi. O resto do dia é lucro.",
    "Sinto quando você cumpre. Fica diferente aqui.",
    "Obrigada por hoje.",
  ],
  radiante: [
    "Está virando rotina. É assim que ganha.",
    "Reparei: você não falha faz dias.",
    "Estou forte hoje. É coisa sua.",
  ],
  faminta: [
    "Faz um dia. Não é cobrança, é só que eu reparei.",
    "Estou com fome. Você sabe do que.",
    "Um dia não quebra nada. Dois começam a quebrar.",
  ],
  saudosa: [
    "Andei te esperando.",
    "Não fui a lugar nenhum. Estava aqui.",
    "Senti falta. Só isso.",
  ],
  descansando: [
    "Cochilei enquanto esperava. Sem mágoa.",
    "Suas raízes continuam aqui. É só voltar.",
    "Nada se perdeu. Começar de novo é diferente de começar do zero.",
  ],

  // Ao tocar na criatura, por elemento
  toque_fogo: [
    "Ei! Estava quase pegando fogo de tédio.",
    "Cuidado, estou quente.",
    "Isso me acorda.",
  ],
  toque_agua: [
    "Ondulei inteiro agora.",
    "Isso é bom. Faz de novo.",
    "Fico mais claro quando você chega.",
  ],
  toque_terra: [
    "Fico aqui, firme. Pode encostar.",
    "Devagar. Sempre devagar.",
    "Gosto de companhia sem pressa.",
  ],
  toque_luz: [
    "Brilhei sem querer.",
    "Você me acendeu um pouco.",
    "Estava guardando luz para agora.",
  ],
};

export const TIME_GREETINGS = [
  { until: 12, key: "manha" },
  { until: 18, key: "tarde" },
  { until: 24, key: "noite" },
];
