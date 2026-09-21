/*
  Ferramentas: objetos que ajudam de verdade, não só de enfeite.

  Cada uma pertence a uma categoria de hábito e entrega conteúdo real — uma
  técnica, um roteiro, um checklist — não um número a mais. É a mesma regra
  do Jardim (nada aqui fabrica XP ou dia cumprido), só que em vez de
  decoração, o que se ganha é algo que a pessoa pode realmente usar.

  source: "loja" (compra com sementes) ou "achado" (destrava sozinha quando
  o histórico do hábito daquela categoria cumpre requires, como os achados).

  app: a rota que a ferramenta abre. Uma ferramenta obtida não é um texto
  guardado numa lista — é um app inteiro que passa a existir (a academia
  com séries e cargas, o radar com os gastos do mês). O content abaixo vira
  a ficha de método dentro do próprio app, onde ele é útil.
*/

export const TOOLS = [
  {
    id: "bullet-journal",
    app: { route: "/app/diario", icon: "notebook", tagline: "Tarefas, notas e eventos do dia" },
    name: "Bullet Journal",
    category: "mente",
    icon: "book",
    source: "loja",
    cost: 4,
    story: "Um caderno de registro rápido. Não é sobre escrever bonito — é sobre não perder o dia.",
    content: {
      intro: "Registro rápido: três marcas, três tipos de linha. O método inteiro cabe numa página.",
      items: [
        { titulo: "• Tarefa", texto: "Uma linha, um verbo. \"Ler 10 páginas\", não \"organizar a leitura\"." },
        { titulo: "– Nota", texto: "Um fato, sem julgamento. \"Li de pé, no ônibus.\" Serve pra daqui a um mês." },
        { titulo: "○ Evento", texto: "Algo que aconteceu, não que você fez. \"Chegou o livro novo.\"" },
        { titulo: "Migração", texto: "No fim da semana, risque o que não migrou de página em página três vezes. Ou não era pra agora, ou não era pra você." },
      ],
    },
  },
  {
    id: "apoiador-leitura",
    app: { route: "/app/leitura", icon: "book", tagline: "Livros, páginas e sessões" },
    name: "Apoiador de Leitura",
    category: "mente",
    icon: "leaf",
    source: "loja",
    cost: 3,
    story: "Segura o livro aberto na página certa. Uma coisa a menos competindo com as duas mãos.",
    content: {
      intro: "Pomodoro de leitura: blocos curtos e fechados leem mais do que uma tarde vaga de \"depois eu leio\".",
      items: [
        { titulo: "25 minutos", texto: "Um alarme, uma página inicial marcada. Só isso — sem meta de quantidade." },
        { titulo: "5 minutos de pausa", texto: "Levante. O corpo parado por muito tempo é o que mais derruba a vontade de continuar." },
        { titulo: "Uma linha por bloco", texto: "Ao parar, escreva uma frase sobre o que leu. É o que transforma \"passei os olhos\" em lembrança." },
        { titulo: "Quatro blocos, descanso longo", texto: "Depois do quarto, pare por pelo menos 20 minutos. Ler cansa como qualquer outro esforço de atenção." },
      ],
    },
  },
  {
    id: "radar-compras",
    app: { route: "/app/financas", icon: "wallet", tagline: "Gastos do mês e a espera de 24h" },
    name: "Radar de Compras",
    category: "trabalho",
    icon: "wind",
    source: "loja",
    cost: 5,
    story: "Não encontra a menor oferta. Encontra a pergunta que faltava antes de comprar.",
    content: {
      intro: "Três perguntas, antes de qualquer compra que não seja essencial — na ordem, sem pular.",
      items: [
        { titulo: "Regra das 24 horas", texto: "Nada de decidir na hora. Coloque no carrinho, feche a aba, volte amanhã." },
        { titulo: "Preciso ou quero?", texto: "As duas coisas são legítimas. Só não confunda uma pela outra na hora de decidir o valor." },
        { titulo: "Quanto tempo de trabalho isso custa?", texto: "Converta o preço em horas do seu salário. Um número muda mais decisão do que o valor em si." },
        { titulo: "50/30/20", texto: "Metade para o essencial, 30% para o que você quer, 20% guardado. Uma compra grande é a fatia de um mês, não de um dia." },
      ],
    },
  },
  {
    id: "coach-academia",
    app: { route: "/app/academia", icon: "dumbbell", tagline: "Treinos, séries e carga" },
    name: "Coach de Academia",
    category: "movimento",
    icon: "flame",
    source: "achado",
    requires: { type: "sequencia", amount: 7 },
    story: "Sete dias seguidos de movimento é o tipo de constância que faz um plano de verdade valer a pena.",
    content: {
      intro: "Um plano de quatro semanas para sair do zero sem se machucar. Cada semana pisa mais fundo que a anterior.",
      items: [
        { titulo: "Semana 1 — Base", texto: "3x na semana, 20 min: 5 min de caminhada, 10 min de exercício, 5 min de volta à calma." },
        { titulo: "Semana 2 — Volume", texto: "Mesmos dias, 25 min. Aumente o tempo, não a intensidade — o corpo ainda está aprendendo a rotina." },
        { titulo: "Semana 3 — Intensidade", texto: "Adicione um quarto dia, mais leve, só de mobilidade. Os outros três sobem de esforço." },
        { titulo: "Semana 4 — Consolidação", texto: "Repita a semana 3 inteira. Se você chegou até aqui, o hábito já existe — agora é manutenção." },
      ],
    },
  },
  {
    id: "despertador",
    app: { route: "/app/despertador", icon: "bell", tagline: "Horários fixos, sem soneca escondida" },
    name: "Despertador",
    category: "corpo",
    icon: "bell",
    source: "loja",
    cost: 3,
    story: "Não acorda por você. Só garante que a hora combinada toque, sempre a mesma, todo dia.",
    content: {
      intro: "Um alarme funciona pela repetição, não pelo volume. Três regras pra ele não virar decoração.",
      items: [
        { titulo: "Mesmo horário todo dia", texto: "Inclusive fim de semana. O corpo aprende a rotina pela constância, não pela exceção." },
        { titulo: "Um propósito por alarme", texto: "\"Acordar\" é vago. \"Levantar pra correr\" tem uma ação esperando do outro lado." },
        { titulo: "Longe da cama", texto: "Se dá pra desligar sem sair da cama, ele apaga sozinho da memória em uma semana." },
      ],
    },
  },
  {
    id: "foco-total",
    app: { route: "/app/foco", icon: "lock", tagline: "Sessões sem distração, contadas de verdade" },
    name: "Foco Total",
    category: "mente",
    icon: "lock",
    source: "loja",
    cost: 5,
    story: "Tranca a tela, não a vontade de checar o celular. Essa parte continua sendo com você.",
    content: {
      intro: "Uma sessão de foco funciona pelo tamanho certo, não pela força de vontade sozinha.",
      items: [
        { titulo: "Escolha o bloco antes", texto: "10, 25 ou 45 minutos — decidido antes de começar, pra não negociar no meio." },
        { titulo: "Distração contada, não escondida", texto: "Sair da aba durante a sessão conta como distração. Ver o número dói mais do que fingir que não saiu." },
        { titulo: "Uma tarefa, não uma lista", texto: "Escreva o que vai fazer nesse bloco antes de travar a tela. Sem alvo, foco vira só tempo parado." },
      ],
    },
  },
  {
    id: "agenda",
    app: { route: "/app/agenda", icon: "calendar", tagline: "O que tem hora marcada" },
    name: "Agenda",
    category: "trabalho",
    icon: "calendar",
    source: "loja",
    cost: 4,
    story: "Não organiza sua vida. Só lembra o que você mesmo decidiu que tinha hora certa.",
    content: {
      intro: "Um compromisso anotado vale mais do que um lembrado de cabeça — a mente é ruim guardando data.",
      items: [
        { titulo: "Data e hora, sempre", texto: "\"Semana que vem\" não é compromisso, é intenção. Vira compromisso quando tem dia e hora." },
        { titulo: "Um verbo no título", texto: "\"Dentista 15h\" já é fato; \"Ligar pro dentista\" é ação — os dois cabem aqui, só não confunda um pelo outro." },
        { titulo: "Revisão de domingo", texto: "Olhe a semana inteira de uma vez antes dela começar. Surpresa de terça é falha de domingo." },
      ],
    },
  },
  {
    id: "metas",
    app: { route: "/app/metas", icon: "target", tagline: "Objetivos com número e prazo" },
    name: "Metas",
    category: "proposito",
    icon: "target",
    source: "loja",
    cost: 4,
    story: "Guarda o alvo, e o quanto falta até ele — pra ambição não ficar só na cabeça.",
    content: {
      intro: "Uma meta sem número é um desejo. Três perguntas transformam desejo em objetivo.",
      items: [
        { titulo: "Quanto, exatamente?", texto: "\"Correr mais\" não termina nunca. \"Correr 10km\" tem uma linha de chegada." },
        { titulo: "Até quando?", texto: "Sem prazo, tudo pode esperar mais um dia — pra sempre." },
        { titulo: "Check-ins, não só o final", texto: "Registrar o progresso no meio do caminho é o que mantém a meta viva entre o começo e o fim." },
      ],
    },
  },
  {
    id: "cofrinho",
    app: { route: "/app/cofre", icon: "piggybank", tagline: "Uma meta de valor, guardada aos poucos" },
    name: "Cofrinho",
    category: "trabalho",
    icon: "piggybank",
    source: "loja",
    cost: 4,
    story: "Não rende juros. Só torna visível o quanto já foi guardado — o que, sozinho, já muda o hábito.",
    content: {
      intro: "Guardar dinheiro é mais sobre ver o progresso do que sobre a quantia em si.",
      items: [
        { titulo: "Um objetivo nomeado", texto: "\"Viagem em dezembro\" guarda mais do que \"reserva\". Nome dá vontade de completar." },
        { titulo: "Qualquer valor conta", texto: "R$5 guardado é R$5 a mais do que ontem. A régua é a constância, não o tamanho do depósito." },
        { titulo: "Retirar também é dado", texto: "Se tirou, tirou — o cofre mostra o saldo real, nunca só o que já entrou." },
      ],
    },
  },
  {
    id: "calculadora-calorias",
    app: { route: "/app/calorias", icon: "apple", tagline: "O que entrou hoje, contra a meta" },
    name: "Calculadora de Calorias",
    category: "corpo",
    icon: "apple",
    source: "loja",
    cost: 3,
    story: "Não julga o prato. Só soma o que já entrou, pra decisão da próxima refeição ser informada.",
    content: {
      intro: "Contar caloria funciona quando é rápido — trave nisso e ninguém sustenta por uma semana.",
      items: [
        { titulo: "Meta diária primeiro", texto: "Sem uma referência, o total do dia não diz nada sobre se foi muito ou pouco." },
        { titulo: "Estimativa vale mais que nada", texto: "\"Cerca de 500\" registrado bate qualquer número exato que você não anotou." },
        { titulo: "Olhe a semana, não o dia", texto: "Um dia acima da meta não desfaz seis dentro dela. A média da semana é o que importa." },
      ],
    },
  },
];

export function getToolItem(id) {
  return TOOLS.find((tool) => tool.id === id) || null;
}
