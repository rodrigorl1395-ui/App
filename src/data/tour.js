/*
  O tour guiado: explica os botões e faz a pessoa usar cada um de verdade,
  em vez de entregar o app inteiro de uma vez. Roda uma única vez, logo
  depois que o primeiro hábito é criado — é o momento em que a tela Hoje
  deixa de estar vazia e passa a ter algo pra ensinar.

  Dois tipos de passo:
    nav   — explica um botão da navegação. Avança com "Entendi" ou sozinho,
            se a pessoa já tocar naquela aba por conta própria.
    acao  — pede uma ação real (cumprir a missão, tocar numa árvore, abrir
            uma tela) e só avança quando ela acontece de verdade. Nenhum
            passo de ação fabrica uma recompensa: o que ele ensina é o
            caminho até algo que o app já dá de verdade.

  A ordem intercala explicação e prática — a mesma missão que a Página Hoje
  já oferece vira a primeira lição, em vez de um passo separado só de
  onboarding.
*/
export const TOUR_STEPS = [
  {
    id: "nav-hoje",
    type: "nav",
    target: "/hoje",
    title: "Hoje",
    text: "Esta é a sua página do dia. Sempre que abrir o app, é aqui que você volta.",
  },
  {
    id: "missao-cumprir",
    type: "acao",
    signal: "missao-cumprida",
    title: "Sua primeira missão",
    text: "No cartão da missão, toque em \"Cumpri hoje\". É o hábito de verdade que você acabou de criar.",
  },
  {
    id: "nav-jardim",
    type: "nav",
    target: "/jardim",
    title: "Jardim",
    text: "Cada hábito planta uma árvore aqui, e um guardião vem morar perto dela.",
  },
  {
    id: "missao-jardim",
    type: "acao",
    signal: "arvore-tocada",
    title: "Visite a sua árvore",
    text: "Toque na árvore do seu hábito. Ela cresce com o que você acabou de fazer.",
  },
  {
    id: "nav-habitos",
    type: "nav",
    target: "/habitos",
    title: "Hábitos",
    text: "Aqui você vê todos os seus hábitos, e o Perfil do Mestre — que é você, não a criatura.",
  },
  {
    id: "missao-mestre",
    type: "acao",
    signal: "perfil-visitado",
    watchPath: "/habitos",
    title: "Seu Perfil do Mestre",
    text: "Role até o Perfil do Mestre. Ele acompanha sua constância no geral, não só de um hábito.",
  },
  {
    id: "nav-apps",
    type: "nav",
    target: "/ferramentas",
    title: "Apps",
    text: "Objetos com efeito real — um app de treino, um controle de gastos — se destravam aqui conforme você avança.",
  },
  {
    id: "nav-santuario",
    type: "nav",
    target: "/santuario",
    title: "Santuário",
    text: "A coleção de guardiões que você ainda vai encontrar. Nenhum pertence a uma área só.",
  },
];
