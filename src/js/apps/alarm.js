/*
  Despertador — o app que a ferramenta do mesmo nome destrava.

  Um alarme aqui é só um registro: horário, dias da semana e um rótulo do
  que ele serve pra fazer. O toque em si depende do navegador estar aberto
  e a aba ativa — é a mesma honestidade do resto do app (nem êxito, nem
  alarme fingindo ser o que não é): por isso a tela sempre diz essa
  condição, em vez de prometer um despertador de verdade.
*/

import { getState, setState } from "../state.js";
import { generateId } from "../utils.js";

export const DIAS = [
  { id: 0, label: "D" },
  { id: 1, label: "S" },
  { id: 2, label: "T" },
  { id: 3, label: "Q" },
  { id: 4, label: "Q" },
  { id: 5, label: "S" },
  { id: 6, label: "S" },
];

export function getAlarms() {
  return [...getState().alarms].sort((a, b) => a.time.localeCompare(b.time));
}

export function addAlarm({ label, time, days }) {
  if (!time) return null;
  const alarme = {
    id: generateId("alarme"),
    label: (label || "").trim() || "Alarme",
    time,
    days: days?.length ? [...days].sort() : [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    lastFiredKey: null,
  };
  setState({ alarms: [...getState().alarms, alarme] });
  return alarme;
}

export function toggleAlarm(id) {
  setState({
    alarms: getState().alarms.map((alarme) =>
      alarme.id === id ? { ...alarme, enabled: !alarme.enabled } : alarme
    ),
  });
}

export function removeAlarm(id) {
  setState({ alarms: getState().alarms.filter((alarme) => alarme.id !== id) });
}

export function diasLabel(days) {
  if (days.length === 7) return "Todo dia";
  if (days.length === 5 && !days.includes(0) && !days.includes(6)) return "Dias de semana";
  if (days.length === 2 && days.includes(0) && days.includes(6)) return "Fim de semana";
  return days
    .slice()
    .sort()
    .map((id) => DIAS[id].label)
    .join(" ");
}

/*
  Vigia leve: uma vez por minuto, olha se algum alarme ligado bate com o
  minuto e o dia de agora. lastFiredKey evita tocar duas vezes no mesmo
  minuto. Só soa enquanto esta aba está aberta — não é um serviço em
  segundo plano, e a tela deixa isso claro.
*/
let vigiaIniciado = false;

export function iniciarVigiaDeAlarmes() {
  if (vigiaIniciado) return;
  vigiaIniciado = true;
  setInterval(verificarAlarmes, 20000);
}

function verificarAlarmes() {
  const agora = new Date();
  const horaAtual = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
  const chaveMinuto = `${agora.toDateString()} ${horaAtual}`;
  const diaSemana = agora.getDay();

  const alarmesTocando = getState().alarms.filter(
    (alarme) =>
      alarme.enabled &&
      alarme.time === horaAtual &&
      alarme.days.includes(diaSemana) &&
      alarme.lastFiredKey !== chaveMinuto
  );
  if (!alarmesTocando.length) return;

  setState({
    alarms: getState().alarms.map((alarme) =>
      alarmesTocando.some((tocando) => tocando.id === alarme.id)
        ? { ...alarme, lastFiredKey: chaveMinuto }
        : alarme
    ),
  });

  for (const alarme of alarmesTocando) {
    dispararNotificacao(alarme);
  }
}

function dispararNotificacao(alarme) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "granted") {
    new Notification(alarme.label, { body: `${alarme.time} · toque para ver` });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission();
  }
}
