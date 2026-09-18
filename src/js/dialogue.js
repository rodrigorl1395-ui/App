// Escolhe o que a criatura diz agora. Guarda a última fala de cada contexto
// para não repetir duas vezes seguidas — repetir é o que faz uma fala parecer
// máquina em vez de companhia.

import { LINES, TIME_GREETINGS } from "../data/dialogue.js";
import { fillNames } from "../data/quests.js";
import { getMood } from "./mood.js";

const lastByContext = new Map();

function pick(key, animal) {
  const options = LINES[key];
  if (!options?.length) return null;

  const last = lastByContext.get(key);
  const pool = options.length > 1 ? options.filter((line) => line !== last) : options;
  const line = pool[Math.floor(Math.random() * pool.length)];
  lastByContext.set(key, line);

  return fillNames(line, animal?.name);
}

function timeKey(date = new Date()) {
  const hour = date.getHours();
  return TIME_GREETINGS.find((slot) => hour < slot.until)?.key || "noite";
}

/*
  A fala de chegada: o humor manda quando ele pede atenção (com fome, com
  saudade, descansando); nos outros casos a saudação do horário varia mais e
  deixa a visita menos repetitiva.
*/
export function getGreeting(animal, habitId) {
  const mood = getMood(habitId);
  const pedeAtencao = ["faminta", "saudosa", "descansando", "novo"].includes(mood.id);
  return pick(pedeAtencao ? mood.id : timeKey(), animal) || pick(mood.id, animal);
}

export function getTouchLine(animal) {
  return pick(`toque_${animal?.element}`, animal) || "…";
}
