/*
  Cofrinho — o app que a ferramenta do mesmo nome destrava.

  Um objetivo (nome e valor), e uma lista de entradas — depósito ou
  retirada. O saldo nunca é um campo editável direto: é sempre a soma dos
  lançamentos, pra "quanto eu já tenho" ser sempre verdade.
*/

import { getState, setState } from "../state.js";
import { generateId, todayKey } from "../utils.js";

export function getGoal() {
  return getState().savingsGoal;
}

export function setGoal({ title, targetAmount }) {
  const valor = Number(targetAmount);
  if (!title?.trim() || !valor || valor <= 0) return null;
  const meta = { title: title.trim(), targetAmount: valor, createdAt: new Date().toISOString() };
  setState({ savingsGoal: meta });
  return meta;
}

export function clearGoal() {
  setState({ savingsGoal: null });
}

export function getEntries() {
  return [...getState().savingsEntries].sort((a, b) => b.date.localeCompare(a.date));
}

export function addEntry({ amount, type, note }) {
  const valor = Number(amount);
  if (!valor || valor <= 0) return null;
  const entrada = {
    id: generateId("cofre"),
    amount: valor,
    type: type === "retirada" ? "retirada" : "deposito",
    note: (note || "").trim() || null,
    date: todayKey(),
    createdAt: new Date().toISOString(),
  };
  setState({ savingsEntries: [...getState().savingsEntries, entrada] });
  return entrada;
}

export function removeEntry(id) {
  setState({ savingsEntries: getState().savingsEntries.filter((entrada) => entrada.id !== id) });
}

export function getSaldo() {
  return getEntries().reduce((soma, entrada) => soma + (entrada.type === "retirada" ? -entrada.amount : entrada.amount), 0);
}

export function getRatio() {
  const meta = getGoal();
  if (!meta) return 0;
  return Math.max(0, Math.min(1, getSaldo() / meta.targetAmount));
}
