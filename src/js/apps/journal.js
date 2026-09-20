/*
  Bullet Journal — o app que a ferramenta do mesmo nome destrava.

  O método inteiro é três marcas: tarefa (•), nota (–) e evento (○). Uma
  linha por coisa, um dia por página. A tarefa que não foi feita migra para
  amanhã — e a migração fica registrada, porque uma tarefa que você migrou
  três vezes está dizendo alguma coisa sobre ela.
*/

import { getState, setState } from "../state.js";
import { generateId, todayKey } from "../utils.js";

export const TIPOS = [
  { id: "tarefa", marca: "•", label: "Tarefa", nota: "Uma linha, um verbo." },
  { id: "nota", marca: "–", label: "Nota", nota: "Um fato, sem julgamento." },
  { id: "evento", marca: "○", label: "Evento", nota: "Algo que aconteceu." },
];

export function getTipo(id) {
  return TIPOS.find((tipo) => tipo.id === id) || TIPOS[0];
}

export function getEntries(dateKey = todayKey()) {
  return getState()
    .journalEntries.filter((entrada) => entrada.date === dateKey)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function addEntry(dateKey, type, text) {
  const conteudo = (text || "").trim();
  if (!conteudo) return null;

  const entrada = {
    id: generateId("linha"),
    date: dateKey,
    type,
    text: conteudo,
    done: false,
    migrations: 0,
    createdAt: new Date().toISOString(),
  };
  setState({ journalEntries: [...getState().journalEntries, entrada] });
  return entrada;
}

function atualizar(id, muda) {
  setState({
    journalEntries: getState().journalEntries.map((entrada) =>
      entrada.id === id ? muda(entrada) : entrada
    ),
  });
}

export function toggleDone(id) {
  atualizar(id, (entrada) => ({ ...entrada, done: !entrada.done }));
}

/*
  Migrar: a tarefa muda de dia e conta mais uma migração. O contador não é
  enfeite — é o sinal de "ou não era para agora, ou não era para você", que
  é o coração do método.
*/
export function migrate(id) {
  const entrada = getState().journalEntries.find((item) => item.id === id);
  if (!entrada) return;

  const amanha = new Date(`${entrada.date}T00:00:00`);
  amanha.setDate(amanha.getDate() + 1);

  atualizar(id, (item) => ({
    ...item,
    date: amanha.toISOString().slice(0, 10),
    migrations: (item.migrations || 0) + 1,
  }));
}

export function removeEntry(id) {
  setState({ journalEntries: getState().journalEntries.filter((entrada) => entrada.id !== id) });
}

export function getPendingCount(dateKey = todayKey()) {
  return getEntries(dateKey).filter((entrada) => entrada.type === "tarefa" && !entrada.done).length;
}

export function deslocarData(dateKey, dias) {
  const data = new Date(`${dateKey}T00:00:00`);
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
}

export function rotuloData(dateKey) {
  if (dateKey === todayKey()) return "Hoje";
  if (dateKey === deslocarData(todayKey(), -1)) return "Ontem";
  if (dateKey === deslocarData(todayKey(), 1)) return "Amanhã";
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(
    new Date(`${dateKey}T00:00:00`)
  );
}
