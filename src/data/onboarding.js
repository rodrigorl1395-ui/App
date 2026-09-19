// O que o professor diz na Academia dos Pequenos Hábitos.
//
// As referências são livros e um estudo reais, então estão descritas com
// precisão. Em especial a de Lally: o estudo não diz "21 dias" nem "66 dias
// para todo mundo" — a mediana foi 66, variando de 18 a 254 conforme a pessoa
// e o hábito. É justamente essa variação que sustenta não haver prazo fixo.

export const ONBOARDING_STEPS = [
  {
    id: "boas-vindas",
    title: "A Academia dos Pequenos Hábitos",
    speech:
      "Bem-vindo à Academia dos Pequenos Hábitos. Você não precisa mudar tudo de uma vez. Grandes transformações começam com pequenas ações repetidas todos os dias.",
    body: "Eu sou seu guia por aqui. Atrás de mim estão os guardiões de cada área da vida — e um deles vai começar esta jornada com você.",
    cta: "Como funciona",
  },
  {
    id: "filosofia",
    title: "1% melhor, sem exigir perfeição",
    speech:
      "A meta não é ser perfeito hoje. É ser um pouco melhor que ontem, tantas vezes que vire quem você é.",
    body: "Este lugar não inventou isso. Ele segue quem estudou o assunto:",
    references: [
      {
        source: "Hábitos Atômicos, James Clear",
        idea: "Pequenas mudanças se acumulam e constroem uma identidade nova. Você não corre: você vira alguém que corre.",
      },
      {
        source: "Tiny Habits, BJ Fogg",
        idea: "Começar pequeno aumenta a chance de continuar. É por isso que aqui toda missão tem uma versão mínima.",
      },
      {
        source: "O Poder do Hábito, Charles Duhigg",
        idea: "Todo hábito tem gatilho, rotina e recompensa. Combinar antes onde e quando é montar o gatilho de propósito.",
      },
      {
        source: "Phillippa Lally, University College London",
        idea: "No estudo dela, virar automático levou 66 dias na mediana — mas variou de 18 a 254. Não existe prazo fixo, e atrasar não significa falhar.",
      },
    ],
    cta: "E os guardiões?",
  },
  {
    id: "animais",
    title: "Cada guardião cuida de uma área",
    speech:
      "Escolher um guardião é escolher um hábito. Ele cresce com o que você faz de verdade — e só com isso.",
    body: "Um guardião cuida de um hábito só. Quando você quiser assumir mais um, vai precisar conquistar o próximo guardião com a sua constância.",
    cta: "Como eu registro",
  },
  {
    id: "missoes",
    title: "Três tamanhos para cada dia",
    speech:
      "Nem todo dia tem a mesma energia. Por isso cada hábito vem em três tamanhos, e todos contam.",
    body: null,
    missions: [
      { label: "Mínima", text: "Para o dia difícil. Mantém a corrente viva quando quase nada é possível." },
      { label: "Principal", text: "O que você planejou. O tamanho normal do seu compromisso." },
      { label: "Bônus", text: "Quando sobrar energia e der vontade de ir além." },
    ],
    note: "Falhar não apaga nada. Um dia ruim só interrompe o ritmo, e sempre existe a missão mínima para voltar.",
    cta: "Estou pronto",
  },
  {
    id: "convite",
    title: "Comece com um",
    speech:
      "Você não precisa dominar todos os hábitos hoje. Precisa apenas começar com um. Uma missão. Um dia. Depois, outro. Está pronto para se tornar um mestre dos pequenos hábitos?",
    body: null,
    cta: "Escolher meu primeiro guardião",
  },
];

// Quem aparece atrás do professor, e a área que cada um representa.
export const TEAM = [
  { animalId: "raposa", area: "movimento" },
  { animalId: "vagalume", area: "foco" },
  { animalId: "coruja", area: "estudos" },
  { animalId: "axolote", area: "recuperação" },
  { animalId: "capivara", area: "constância" },
  { animalId: "tartaruga", area: "paciência" },
  { animalId: "ourico", area: "equilíbrio" },
  { animalId: "lince", area: "disciplina" },
];
