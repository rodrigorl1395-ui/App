/*
  Agenda — o app que a ferramenta do mesmo nome destrava.

  Compromissos com data e hora marcada. Nada de recorrência ou categoria:
  o que entra aqui é o que já tem dia certo — o resto é hábito, e mora nas
  outras telas do app.
*/

import { getState, setState } from "../state.js";
import { generateId, todayKey } from "../utils.js";

export function getEvents() {
  return getState().agendaEvents;
}

export function addEvent({ title, date, time, notes }) {
  if (!title?.trim() || !date) return null;
  const evento = {
    id: generateId("evento"),
    title: title.trim(),
    date,
    time: time || null,
    notes: (notes || "").trim() || null,
    done: false,
    createdAt: new Date().toISOString(),
  };
  setState({ agendaEvents: [...getEvents(), evento] });
  return evento;
}

export function toggleEvent(id) {
  setState({
    agendaEvents: getEvents().map((evento) => (evento.id === id ? { ...evento, done: !evento.done } : evento)),
  });
}

export function removeEvent(id) {
  setState({ agendaEvents: getEvents().filter((evento) => evento.id !== id) });
}

function chave(evento) {
  return `${evento.date}T${evento.time || "00:00"}`;
}

// A partir de hoje, não concluídos primeiro — o que já passou e não foi
// marcado sobe pro topo, porque é o que mais precisa de atenção.
export function getUpcoming() {
  return getEvents()
    .filter((evento) => !evento.done)
    .sort((a, b) => chave(a).localeCompare(chave(b)));
}

export function getPast() {
  const hoje = todayKey();
  return getEvents()
    .filter((evento) => evento.done || evento.date < hoje)
    .sort((a, b) => chave(b).localeCompare(chave(a)));
}

export function isAtrasado(evento) {
  return !evento.done && evento.date < todayKey();
}
