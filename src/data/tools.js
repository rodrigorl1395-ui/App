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
];

export function getToolItem(id) {
  return TOOLS.find((tool) => tool.id === id) || null;
}
