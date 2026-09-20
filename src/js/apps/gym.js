/*
  Academia — o app que a ferramenta "Coach de Academia" destrava.

  Não é um texto sobre treinar: é onde o treino acontece. Planos com
  exercícios, séries marcadas uma a uma com carga e repetição, histórico do
  que foi feito e o recorde de cada exercício.

  O que fica guardado é só o que a pessoa fez ou escolheu — planos e séries
  registradas. Contagem da semana, recorde e volume saem disso na hora, como
  todo o resto do app.
*/

import { getState, setState } from "../state.js";
import { generateId } from "../utils.js";
import { todayKey } from "../utils.js";

/*
  Os três treinos que vêm prontos. São um ponto de partida de verdade (o
  clássico empurrar/puxar/pernas somado a um de corpo inteiro para quem
  treina três vezes por semana), não um exemplo vazio — quem abre o app
  pela primeira vez consegue treinar hoje, sem montar nada.
*/
export const PLANOS_PADRAO = [
  {
    nome: "A · Corpo inteiro",
    exercicios: [
      { nome: "Agachamento livre", series: 3, reps: 10 },
      { nome: "Supino reto", series: 3, reps: 10 },
      { nome: "Remada curvada", series: 3, reps: 10 },
      { nome: "Elevação lateral", series: 3, reps: 12 },
      { nome: "Prancha (segundos)", series: 3, reps: 30 },
    ],
  },
  {
    nome: "B · Empurrar",
    exercicios: [
      { nome: "Supino inclinado", series: 4, reps: 8 },
      { nome: "Desenvolvimento militar", series: 3, reps: 10 },
      { nome: "Tríceps na corda", series: 3, reps: 12 },
      { nome: "Flexão de braço", series: 3, reps: 12 },
    ],
  },
  {
    nome: "C · Puxar e pernas",
    exercicios: [
      { nome: "Levantamento terra", series: 3, reps: 8 },
      { nome: "Puxada alta", series: 3, reps: 10 },
      { nome: "Rosca direta", series: 3, reps: 12 },
      { nome: "Leg press", series: 3, reps: 12 },
    ],
  },
];

export function getPlans() {
  return getState().workoutPlans;
}

// Os planos prontos entram uma vez só, na primeira abertura. Depois disso o
// app é da pessoa: se ela apagar tudo, fica apagado.
export function ensureDefaultPlans() {
  if (getPlans().length || getSessions().length) return;
  setState({
    workoutPlans: PLANOS_PADRAO.map((plano) => ({
      id: generateId("plano"),
      name: plano.nome,
      createdAt: new Date().toISOString(),
      exercises: plano.exercicios.map((ex) => ({
        id: generateId("ex"),
        name: ex.nome,
        sets: ex.series,
        reps: ex.reps,
      })),
    })),
  });
}

export function getPlan(id) {
  return getPlans().find((plano) => plano.id === id) || null;
}

export function createPlan(name) {
  const plano = { id: generateId("plano"), name, createdAt: new Date().toISOString(), exercises: [] };
  setState({ workoutPlans: [...getPlans(), plano] });
  return plano;
}

export function removePlan(id) {
  setState({ workoutPlans: getPlans().filter((plano) => plano.id !== id) });
}

function atualizarPlano(id, muda) {
  setState({
    workoutPlans: getPlans().map((plano) => (plano.id === id ? muda(plano) : plano)),
  });
}

export function addExercise(planId, { name, sets, reps }) {
  atualizarPlano(planId, (plano) => ({
    ...plano,
    exercises: [...plano.exercises, { id: generateId("ex"), name, sets, reps }],
  }));
}

export function removeExercise(planId, exerciseId) {
  atualizarPlano(planId, (plano) => ({
    ...plano,
    exercises: plano.exercises.filter((ex) => ex.id !== exerciseId),
  }));
}

/* ------------------------------------------------------------------ */
/* Sessões                                                             */
/* ------------------------------------------------------------------ */

export function getSessions() {
  return getState().workoutSessions;
}

// Um treino aberto por vez: dois em paralelo não existem na vida real e
// bagunçariam a marcação de série.
export function getActiveSession() {
  return getSessions().find((sessao) => !sessao.finishedAt) || null;
}

export function startSession(planId) {
  const aberta = getActiveSession();
  if (aberta) return aberta;

  const plano = getPlan(planId);
  if (!plano) return null;

  const sessao = {
    id: generateId("treino"),
    planId,
    planName: plano.name,
    date: todayKey(),
    startedAt: new Date().toISOString(),
    finishedAt: null,
    sets: [],
  };
  setState({ workoutSessions: [...getSessions(), sessao] });
  return sessao;
}

function atualizarSessao(id, muda) {
  setState({
    workoutSessions: getSessions().map((sessao) => (sessao.id === id ? muda(sessao) : sessao)),
  });
}

/*
  Marcar uma série. Marcar de novo a mesma série desmarca — é o jeito de
  corrigir um toque errado sem precisar de botão de desfazer.
*/
export function toggleSet(sessionId, exercise, index, { reps, weight }) {
  atualizarSessao(sessionId, (sessao) => {
    const existente = sessao.sets.find((s) => s.exerciseId === exercise.id && s.index === index);
    if (existente) {
      return { ...sessao, sets: sessao.sets.filter((s) => s !== existente) };
    }
    return {
      ...sessao,
      sets: [
        ...sessao.sets,
        {
          id: generateId("serie"),
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          index,
          reps: Number(reps) || exercise.reps,
          weight: Number(weight) || 0,
          at: new Date().toISOString(),
        },
      ],
    };
  });
}

export function isSetDone(session, exerciseId, index) {
  return session.sets.some((s) => s.exerciseId === exerciseId && s.index === index);
}

export function finishSession(sessionId) {
  atualizarSessao(sessionId, (sessao) => ({ ...sessao, finishedAt: new Date().toISOString() }));
}

// Um treino sem série nenhuma marcada não é treino: cancelar apaga, em vez
// de deixar um registro vazio sujando o histórico.
export function cancelSession(sessionId) {
  setState({ workoutSessions: getSessions().filter((sessao) => sessao.id !== sessionId) });
}

export function getFinishedSessions() {
  return getSessions()
    .filter((sessao) => sessao.finishedAt)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function getWeekCount() {
  const limite = new Date();
  limite.setDate(limite.getDate() - 7);
  const chave = limite.toISOString().slice(0, 10);
  return getFinishedSessions().filter((sessao) => sessao.date > chave).length;
}

// Volume é carga vezes repetição somada — o número que diz se o treino de
// hoje foi maior que o da semana passada, e não só se aconteceu.
export function sessionVolume(session) {
  return session.sets.reduce((total, serie) => total + serie.weight * serie.reps, 0);
}

/*
  Recorde por exercício: a maior carga já registrada, com a repetição em que
  ela aconteceu. É o que transforma "fui à academia" em progresso visível.
*/
export function getRecords() {
  const porExercicio = new Map();
  for (const sessao of getFinishedSessions()) {
    for (const serie of sessao.sets) {
      if (!serie.weight) continue;
      const atual = porExercicio.get(serie.exerciseName);
      if (!atual || serie.weight > atual.weight) {
        porExercicio.set(serie.exerciseName, { weight: serie.weight, reps: serie.reps, date: sessao.date });
      }
    }
  }
  return [...porExercicio.entries()]
    .map(([name, dados]) => ({ name, ...dados }))
    .sort((a, b) => b.weight - a.weight);
}

// A última carga usada num exercício vira a sugestão da próxima vez —
// ninguém devia precisar lembrar quanto levantou na terça passada.
export function lastWeightOf(exerciseName) {
  for (const sessao of getFinishedSessions()) {
    const serie = [...sessao.sets].reverse().find((s) => s.exerciseName === exerciseName && s.weight);
    if (serie) return serie.weight;
  }
  return null;
}
