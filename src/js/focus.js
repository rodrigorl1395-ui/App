/*
  O "agora" do dia: qual hábito precisa de você primeiro, e em que ponto o
  dia está. Como todo o resto, é leitura do histórico — nada aqui é gravado
  em campo próprio, nem sequer o dia da jornada, que sai de meta.firstOpenedAt.
*/

import { getState } from "./state.js";
import { isDoneToday, getMissForToday } from "./missions.js";
import { daysBetween } from "./stats.js";
import { todayKey } from "./utils.js";

// Escolha rápida de quando, sem formulário: cada opção já é uma frase pronta.
export const WHEN_OPTIONS = [
  { id: "agora", label: "Agora" },
  { id: "manha", label: "De manhã" },
  { id: "tarde", label: "À tarde" },
  { id: "noite", label: "À noite" },
  { id: "custom", label: "Escolher horário" },
];

export const WHERE_OPTIONS = [
  { id: "casa", label: "Em casa" },
  { id: "rua", label: "Na rua" },
  { id: "academia", label: "Na academia" },
  { id: "trabalho", label: "No trabalho" },
  { id: "outro", label: "Outro lugar" },
];

/*
  Junta quando e onde numa frase — o mesmo texto livre que o combinado
  sempre guardou (savePlan continua recebendo só uma string), só que
  montado por toque em vez de digitado. Sem os dois, ainda funciona com um
  só: dizer só "De manhã" já é um combinado válido.
*/
export function buildPlanText({ whenId, customTime, whereId }) {
  const partes = [];

  if (whenId === "custom" && customTime) {
    partes.push(`Às ${customTime}`);
  } else {
    const when = WHEN_OPTIONS.find((option) => option.id === whenId);
    if (when) partes.push(when.label);
  }

  const where = WHERE_OPTIONS.find((option) => option.id === whereId);
  if (where) partes.push(where.label.charAt(0).toLowerCase() + where.label.slice(1));

  return partes.join(", ");
}

// Quantos dias desde a primeira vez que o app foi aberto — o "dia N" da
// jornada, mostrado baixinho no cabeçalho.
export function getJourneyDay() {
  const firstOpenedAt = getState().meta?.firstOpenedAt;
  if (!firstOpenedAt) return 1;
  return Math.max(1, daysBetween(firstOpenedAt.slice(0, 10), todayKey()) + 1);
}

/*
  Quem entra em foco agora: o primeiro hábito, na ordem em que foi criado,
  que ainda não tem uma resposta para hoje — nem cumprido, nem admitido.

  Ordem de criação e não "mais urgente" de propósito: previsibilidade. A
  pessoa aprende onde cada hábito mora na lista, em vez da prioridade pular
  de lugar todo dia por causa de um cálculo que ela não vê.
*/
export function getPriorityHabit(habits) {
  return habits.find((habit) => !isDoneToday(habit.id) && !getMissForToday(habit.id)) || null;
}

/*
  O retrato do dia inteiro, para a tela decidir o que mostrar no topo:
  vazio (sem hábito nenhum), pendente (ainda há o que fazer), completo
  (tudo cumprido) ou recuperação (tudo respondido, mas só com admissões —
  um dia difícil por inteiro, que ainda merece a mensagem certa).
*/
export function getDayStatus(habits) {
  const done = habits.filter((habit) => isDoneToday(habit.id)).length;
  const missed = habits.filter((habit) => Boolean(getMissForToday(habit.id))).length;
  const pending = habits.length - done - missed;

  const status = !habits.length
    ? "vazio"
    : pending > 0
      ? "pendente"
      : missed > 0
        ? "recuperacao"
        : "completo";

  return { status, done, missed, pending, total: habits.length };
}
