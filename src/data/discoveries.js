// O que a criatura encontra e guarda para te dar. São a coleção paralela ao
// hábito: não aparecem com o tempo parado, e sim com atividade de verdade —
// por isso usam os mesmos tipos de meta da Jornada.
//
// element: null vale para qualquer criatura; com elemento, só aparece para as
// daquele elemento, o que faz cada companheiro ter achados próprios.

export const DISCOVERIES = [
  {
    id: "pedra-lisa",
    name: "Pedra Lisa",
    icon: "sprout",
    element: null,
    requires: { type: "dias", amount: 2 },
    story: "Achei perto de onde você passa. Ficou lisa de tanto a água insistir.",
  },
  {
    id: "brasa-adormecida",
    name: "Brasa Adormecida",
    icon: "flame",
    element: "fogo",
    requires: { type: "dias", amount: 4 },
    story: "Ainda está quente por dentro. Como quase tudo que parece apagado.",
  },
  {
    id: "escama-orvalho",
    name: "Escama de Orvalho",
    icon: "droplet",
    element: "agua",
    requires: { type: "dias", amount: 4 },
    story: "Caiu de mim numa manhã fria. Guardei achando que você ia gostar.",
  },
  {
    id: "semente-antiga",
    name: "Semente Antiga",
    icon: "sprout",
    element: "terra",
    requires: { type: "dias", amount: 4 },
    story: "Estava enterrada há muito tempo. Continua viva. Sementes têm paciência.",
  },
  {
    id: "fagulha-constelacao",
    name: "Fagulha de Constelação",
    icon: "star",
    element: "luz",
    requires: { type: "dias", amount: 4 },
    story: "Caiu do céu ou da minha cabeça, não sei dizer. Brilha igual.",
  },
  {
    id: "pena-torta",
    name: "Pena Torta",
    icon: "sprout",
    element: null,
    requires: { type: "sequencia", amount: 3 },
    story: "Torta assim mesmo. Voou bem do mesmo jeito.",
  },
  {
    id: "no-desfeito",
    name: "Nó Desfeito",
    icon: "droplet",
    element: null,
    requires: { type: "retorno", amount: 1 },
    story: "Passei dias tentando desatar. Saiu no dia em que você voltou.",
  },
  {
    id: "caderno-molhado",
    name: "Caderno Molhado",
    icon: "book",
    element: null,
    requires: { type: "lembrancas", amount: 2 },
    story: "As páginas borraram, mas dá para ler. Suas lembranças ficaram aqui.",
  },
  {
    id: "espelho-rachado",
    name: "Espelho Rachado",
    icon: "star",
    element: null,
    requires: { type: "dias", amount: 10 },
    story: "Rachado, mas ainda mostra. Você não está igual ao de dez dias atrás.",
  },
  {
    id: "raiz-profunda",
    name: "Raiz Profunda",
    icon: "sprout",
    element: null,
    requires: { type: "dias", amount: 30 },
    story: "Cavei fundo para trazer esta. Foi de onde você plantou.",
  },
];
