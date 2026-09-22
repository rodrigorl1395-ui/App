/*
  Rotinas — o app que a ferramenta do mesmo nome destrava.

  Sequências que se repetem (acordar, fechar o dia, sair de casa). O que
  fica guardado é a rotina, seus passos em ordem e cada execução — a
  contagem da semana, a mais usada e a sequência de dias saem disso na hora.

  A execução em andamento é uma execução sem finishedAt, guardada junto das
  outras: assim sair da tela no meio não perde os passos já marcados.
*/

import { getState, setState } from "../state.js";
import { generateId, todayKey } from "../utils.js";

export function getRoutines() {
  return getState().routines;
}

export function getRoutine(id) {
  return getRoutines().find((rotina) => rotina.id === id) || null;
}

export function createRoutine(name) {
  if (!name?.trim()) return null;
  const rotina = {
    id: generateId("rotina"),
    name: name.trim(),
    steps: [],
    runs: [],
    createdAt: new Date().toISOString(),
  };
  setState({ routines: [...getRoutines(), rotina] });
  return rotina;
}

export function removeRoutine(id) {
  setState({ routines: getRoutines().filter((rotina) => rotina.id !== id) });
}

function atualizarRotina(id, muda) {
  setState({ routines: getRoutines().map((rotina) => (rotina.id === id ? muda(rotina) : rotina)) });
}

export function addStep(routineId, text) {
  if (!text?.trim()) return;
  atualizarRotina(routineId, (rotina) => ({
    ...rotina,
    steps: [...rotina.steps, { id: generateId("passo"), text: text.trim() }],
  }));
}

export function removeStep(routineId, stepId) {
  atualizarRotina(routineId, (rotina) => ({
    ...rotina,
    steps: rotina.steps.filter((passo) => passo.id !== stepId),
  }));
}

/* ------------------------------------------------------------------ */
/* Execuções                                                           */
/* ------------------------------------------------------------------ */

// Uma execução aberta por vez, em qualquer rotina: duas sequências em
// paralelo não existem na vida real.
export function getActiveRun() {
  for (const rotina of getRoutines()) {
    const aberta = rotina.runs.find((execucao) => !execucao.finishedAt);
    if (aberta) return { rotina, execucao: aberta };
  }
  return null;
}

export function startRun(routineId) {
  const aberta = getActiveRun();
  if (aberta) return aberta;

  const rotina = getRoutine(routineId);
  if (!rotina?.steps.length) return null;

  atualizarRotina(routineId, (atual) => ({
    ...atual,
    runs: [
      ...atual.runs,
      { id: generateId("execucao"), date: todayKey(), startedAt: new Date().toISOString(), finishedAt: null, done: [] },
    ],
  }));
  return getActiveRun();
}

// Marcar de novo o mesmo passo desmarca — é o jeito de corrigir um toque
// errado sem botão de desfazer.
export function toggleStep(routineId, runId, stepId) {
  atualizarRotina(routineId, (rotina) => ({
    ...rotina,
    runs: rotina.runs.map((execucao) =>
      execucao.id === runId
        ? {
            ...execucao,
            done: execucao.done.includes(stepId)
              ? execucao.done.filter((id) => id !== stepId)
              : [...execucao.done, stepId],
          }
        : execucao
    ),
  }));
}

export function finishRun(routineId, runId) {
  atualizarRotina(routineId, (rotina) => ({
    ...rotina,
    runs: rotina.runs.map((execucao) =>
      execucao.id === runId ? { ...execucao, finishedAt: new Date().toISOString() } : execucao
    ),
  }));
}

// Execução sem passo nenhum marcado não é execução: cancelar apaga, em vez
// de deixar um registro vazio no histórico.
export function cancelRun(routineId, runId) {
  atualizarRotina(routineId, (rotina) => ({
    ...rotina,
    runs: rotina.runs.filter((execucao) => execucao.id !== runId),
  }));
}

export function getExecucoes() {
  return getRoutines()
    .flatMap((rotina) => rotina.runs.filter((e) => e.finishedAt).map((e) => ({ ...e, routineName: rotina.name })))
    .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
}

export function getSemana() {
  const limite = new Date();
  limite.setDate(limite.getDate() - 7);
  const chave = todayKey(limite);
  return getExecucoes().filter((execucao) => execucao.date > chave).length;
}

export function getMaisUsada() {
  let campea = null;
  for (const rotina of getRoutines()) {
    const total = rotina.runs.filter((e) => e.finishedAt).length;
    if (total && (!campea || total > campea.total)) campea = { name: rotina.name, total };
  }
  return campea;
}

/*
  Sequência de dias seguidos com pelo menos uma execução. Conta a partir de
  hoje, ou de ontem se hoje ainda não teve nada — o dia em curso não deveria
  zerar o que foi feito até ontem.
*/
export function getSequencia() {
  const dias = new Set(getExecucoes().map((execucao) => execucao.date));
  if (!dias.size) return 0;

  const cursor = new Date();
  if (!dias.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let sequencia = 0;
  while (dias.has(todayKey(cursor))) {
    sequencia += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return sequencia;
}
