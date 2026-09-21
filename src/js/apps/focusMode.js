/*
  Foco Total — o app que a ferramenta do mesmo nome destrava.

  Uma sessão trava a navegação por dentro do próprio app (esconde cabeçalho
  e nav) pelo tempo escolhido. Não existe bloqueio de tela de verdade fora
  do navegador — o que existe é contar, sem esconder, toda vez que a aba
  perdeu o foco durante a sessão. É a mesma regra do resto do app: nada
  aqui finge ser o que não é.
*/

import { getState, setState } from "../state.js";
import { generateId, todayKey } from "../utils.js";

export const BLOCOS = [10, 25, 45];

export function getSessions() {
  return getState().focusSessions;
}

export function getActiveSession() {
  return getSessions().find((sessao) => !sessao.endedAt) || null;
}

export function startSession({ minutes, task }) {
  const aberta = getActiveSession();
  if (aberta) return aberta;

  const sessao = {
    id: generateId("foco"),
    date: todayKey(),
    task: (task || "").trim() || "Foco",
    minutes,
    interruptions: 0,
    startedAt: new Date().toISOString(),
    endedAt: null,
    completed: false,
  };
  setState({ focusSessions: [...getSessions(), sessao] });
  return sessao;
}

function atualizarSessao(id, muda) {
  setState({ focusSessions: getSessions().map((sessao) => (sessao.id === id ? muda(sessao) : sessao)) });
}

export function registrarDistracao(id) {
  atualizarSessao(id, (sessao) => ({ ...sessao, interruptions: sessao.interruptions + 1 }));
}

export function encerrarSessao(id, { completed }) {
  atualizarSessao(id, (sessao) => ({ ...sessao, endedAt: new Date().toISOString(), completed }));
}

// Uma sessão cancelada logo no início (sem nem um minuto) não conta história
// nenhuma — apagar em vez de deixar um registro de zero minutos.
export function cancelarSessao(id) {
  const sessao = getSessions().find((item) => item.id === id);
  if (!sessao) return;
  const decorridos = (Date.now() - new Date(sessao.startedAt).getTime()) / 60000;
  if (decorridos < 1) {
    setState({ focusSessions: getSessions().filter((item) => item.id !== id) });
  } else {
    encerrarSessao(id, { completed: false });
  }
}

export function getFinishedSessions() {
  return getSessions()
    .filter((sessao) => sessao.endedAt)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function getTodayMinutes() {
  const hoje = todayKey();
  return getFinishedSessions()
    .filter((sessao) => sessao.date === hoje)
    .reduce((soma, sessao) => soma + sessao.minutes, 0);
}

export function getWeekMinutes() {
  const limite = new Date();
  limite.setDate(limite.getDate() - 7);
  const chave = limite.toISOString().slice(0, 10);
  return getFinishedSessions()
    .filter((sessao) => sessao.date > chave)
    .reduce((soma, sessao) => soma + sessao.minutes, 0);
}

export function getWeekDistractions() {
  const limite = new Date();
  limite.setDate(limite.getDate() - 7);
  const chave = limite.toISOString().slice(0, 10);
  return getFinishedSessions()
    .filter((sessao) => sessao.date > chave)
    .reduce((soma, sessao) => soma + sessao.interruptions, 0);
}
