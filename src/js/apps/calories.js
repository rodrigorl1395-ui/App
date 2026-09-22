/*
  Calculadora de Calorias — o app que a ferramenta do mesmo nome destrava.

  Uma meta diária (guardada em settings, como o tema) e um log de
  refeições por dia. O que sobra é sempre calculado — nunca editado direto
  — e a média da semana existe porque um dia isolado não conta a história.
*/

import { getState, setState } from "../state.js";
import { generateId, todayKey } from "../utils.js";

export function getGoal() {
  return getState().settings?.calorieGoal || 0;
}

export function setGoalKcal(valor) {
  setState({ settings: { ...getState().settings, calorieGoal: Number(valor) || 0 } });
}

export function getLogs() {
  return getState().calorieLogs;
}

export function getDayLogs(date = todayKey()) {
  return getLogs()
    .filter((log) => log.date === date)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function addLog({ name, kcal, date }) {
  const valor = Number(kcal);
  if (!name?.trim() || !valor || valor <= 0) return null;
  const log = {
    id: generateId("caloria"),
    name: name.trim(),
    kcal: valor,
    date: date || todayKey(),
    createdAt: new Date().toISOString(),
  };
  setState({ calorieLogs: [...getLogs(), log] });
  return log;
}

export function removeLog(id) {
  setState({ calorieLogs: getLogs().filter((log) => log.id !== id) });
}

export function getDayTotal(date = todayKey()) {
  return getDayLogs(date).reduce((soma, log) => soma + log.kcal, 0);
}

export function getWeekAverage() {
  const dias = new Map();
  const limite = new Date();
  limite.setDate(limite.getDate() - 7);
  const chave = limite.toISOString().slice(0, 10);

  for (const log of getLogs()) {
    if (log.date <= chave) continue;
    dias.set(log.date, (dias.get(log.date) || 0) + log.kcal);
  }
  if (!dias.size) return 0;
  const total = [...dias.values()].reduce((soma, valor) => soma + valor, 0);
  return Math.round(total / dias.size);
}
