// O poder de cada criatura, por elemento.
//
// Regra que nenhum poder pode quebrar: não existe poder que marque um dia
// como cumprido sem a pessoa ter cumprido. O histórico é a única coisa que o
// app tem de verdade — um poder que mente nele destrói o valor do resto.
// Por isso o descanso aparece no calendário como descanso, e não como feito.
//
// Cada poder é de um tipo diferente para não virarem quatro versões de
// "ganhe mais XP": proteger, dobrar, rebaixar a barra e revelar.

export const POWERS = {
  agua: {
    id: "mare-calma",
    element: "agua",
    name: "Maré Calma",
    verb: "Declarar descanso",
    description:
      "Declara hoje como dia de descanso. A sequência não quebra, e o calendário registra descanso — não um dia cumprido.",
    story: "Descansar faz parte. Quem só sabe avançar acaba parando de vez.",
    // Usa-se no lugar de cumprir, então só quando o dia ainda está aberto.
    availableWhen: "pendente",
  },
  fogo: {
    id: "brasa-dobrada",
    name: "Brasa Dobrada",
    element: "fogo",
    verb: "Acender",
    description: "O próximo registro de hoje vale o dobro de XP.",
    story: "Tem dia que a vontade vem inteira. Nesse dia, aproveite tudo.",
    availableWhen: "pendente",
  },
  terra: {
    id: "raiz-profunda",
    name: "Raiz Profunda",
    element: "terra",
    verb: "Firmar",
    description:
      "Hoje a missão mínima vale como a principal. Para o dia em que sair só o mínimo — e o mínimo já custou.",
    story: "Num dia ruim, o pouco que você fez vale o que teria valido num dia bom.",
    availableWhen: "pendente",
  },
  luz: {
    id: "vislumbre",
    name: "Vislumbre",
    element: "luz",
    verb: "Espiar",
    description: "Revela a próxima missão selada da sua jornada.",
    story: "Ver um pedaço do caminho adiante não é trapaça. É motivo.",
    availableWhen: "sempre",
  },
  ar: {
    id: "sopro-claro",
    name: "Sopro Claro",
    element: "ar",
    verb: "Clarear",
    description:
      "Escolhe qual hábito abre a tela Hoje, em vez da ordem automática. Vale até o fim do dia.",
    story: "Saber por onde começar já resolve metade do dia.",
    availableWhen: "sempre",
  },
  espirito: {
    id: "fio-de-sentido",
    name: "Fio de Sentido",
    element: "espirito",
    verb: "Lembrar",
    description:
      "Traz de volta uma lembrança que você guardou num dia bom, escolhida ao acaso do seu próprio histórico.",
    story: "Nos dias em que o porquê some, quem responde é você mesmo, de outro dia.",
    availableWhen: "sempre",
  },
};

// Uma carga a cada tantos dias cumpridos: o poder é conquistado, não dado.
export const DAYS_PER_CHARGE = 5;

export function getPowerForElement(element) {
  return POWERS[element] || null;
}
