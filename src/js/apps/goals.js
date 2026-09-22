/*
  Metas — o app que a ferramenta do mesmo nome destrava.

  Uma meta tem um alvo numérico e, opcionalmente, um prazo. O progresso
  nasce da soma dos check-ins — nunca de um campo editável direto — porque
  o valor de hoje só importa junto da história de como se chegou até ele.
*/

import { getState, setState } from "../state.js";
import { generateId, todayKey } from "../utils.js";

export function getGoals() {
  return getState().goals;
}

export function getGoal(id) {
  return getGoals().find((meta) => meta.id === id) || null;
}

export function addGoal({ title, targetValue, unit, targetDate }) {
  if (!title?.trim() || !targetValue || Number(targetValue) <= 0) return null;
  const meta = {
    id: generateId("meta"),
    title: title.trim(),
    targetValue: Number(targetValue),
    unit: (unit || "").trim() || "un.",
    targetDate: targetDate || null,
    createdAt: new Date().toISOString(),
    checkins: [],
    completedAt: null,
  };
  setState({ goals: [...getGoals(), meta] });
  return meta;
}

export function removeGoal(id) {
  setState({ goals: getGoals().filter((meta) => meta.id !== id) });
}

function atualizarMeta(id, muda) {
  setState({ goals: getGoals().map((meta) => (meta.id === id ? muda(meta) : meta)) });
}

export function addCheckin(id, { amount, note }) {
  const valor = Number(amount);
  if (!valor) return;
  atualizarMeta(id, (meta) => {
    const checkins = [
      ...meta.checkins,
      { id: generateId("checkin"), amount: valor, note: (note || "").trim() || null, date: todayKey() },
    ];
    const total = checkins.reduce((soma, item) => soma + item.amount, 0);
    return {
      ...meta,
      checkins,
      completedAt: !meta.completedAt && total >= meta.targetValue ? new Date().toISOString() : meta.completedAt,
    };
  });
}

export function getProgress(meta) {
  const total = meta.checkins.reduce((soma, item) => soma + item.amount, 0);
  return { total, ratio: Math.min(1, total / meta.targetValue) };
}

export function getActiveGoals() {
  return getGoals().filter((meta) => !meta.completedAt);
}

export function getCompletedGoals() {
  return getGoals().filter((meta) => meta.completedAt);
}

export function diasRestantes(meta) {
  if (!meta.targetDate) return null;
  const diff = Math.ceil((new Date(`${meta.targetDate}T00:00:00`).getTime() - Date.now()) / 86400000);
  return diff;
}
