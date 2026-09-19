// Missões do dia: três níveis por hábito, cada um valendo um XP diferente.
// Concluir a missão mínima já conta — é o que evita o "se não posso fazer
// tudo, então não faço nada".

import { getState, setState } from "./state.js";
import { generateId, todayKey } from "./utils.js";
import { getStage } from "./evolution.js";
import { getAnimalXp, getUnlockedAnimals, findNewlyUnlocked } from "./companion.js";
import { getActiveEffects } from "./powers.js";

export const MISSION_LEVELS = {
  minimal: { key: "minimal", label: "Mínima", xp: 10 },
  main: { key: "main", label: "Principal", xp: 25 },
  bonus: { key: "bonus", label: "Bônus", xp: 40 },
};

export function getLogs() {
  return getState().logs;
}

/*
  O ritual do hábito tem três atos, e só o do meio é obrigatório:

  1. Combinar — onde e quando vai acontecer. Dito antes, em voz própria,
     é o que mais aumenta a chance de acontecer de verdade.
  2. Cumprir  — a missão mínima, principal ou bônus.
  3. Guardar  — uma linha positiva sobre o dia. Vira um fruto na árvore.

  A árvore cresce por fazer; o fruto nasce por refletir.
*/

export function getPlanForToday(habitId) {
  const today = todayKey();
  return getState().plans.find((plan) => plan.habitId === habitId && plan.date === today) || null;
}

export function savePlan(habitId, text) {
  const today = todayKey();
  const plans = getState().plans.filter((plan) => !(plan.habitId === habitId && plan.date === today));
  setState({ plans: [...plans, { habitId, date: today, text }] });
}

// Como a pessoa se sentiu. Fica junto da lembrança, no registro do dia.
export const FEELINGS = [
  { id: "facil", label: "Fácil" },
  { id: "normal", label: "Normal" },
  { id: "dificil", label: "Difícil" },
  { id: "muito-bom", label: "Muito bom" },
  { id: "cansativo", label: "Cansativo" },
];

// A lembrança vai no registro do dia: é o fruto daquele dia.
export function saveReflection(logId, text, feeling = null) {
  setState({
    logs: getLogs().map((log) =>
      log.id === logId ? { ...log, reflection: text, feeling } : log
    ),
  });
}

export function getFeelingLabel(id) {
  return FEELINGS.find((feeling) => feeling.id === id)?.label || null;
}

export function getFruits(habitId) {
  return getLogs()
    .filter((log) => log.habitId === habitId && log.reflection)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getLogForToday(habitId) {
  const today = todayKey();
  return getLogs().find((log) => log.habitId === habitId && log.date === today) || null;
}

export function isDoneToday(habitId) {
  return Boolean(getLogForToday(habitId));
}

/*
  Admitir que hoje não deu — o quarto tipo de registro do dia, ao lado do
  combinado e da lembrança. Não é um poder: não protege sequência, não
  gasta carga nenhuma, e qualquer um pode declarar quantas vezes quiser.
  A única coisa que ele faz é trocar o silêncio por uma frase verdadeira.

  Por isso ele nunca concorre com o descanso declarado (Maré Calma): aquele
  poder já é a história "eu decidi descansar, e isso está certo". Esta é a
  história "eu não consegui, e tudo bem dizer isso".
*/
function hasRestDayToday(habitId) {
  const today = todayKey();
  return getState().powerUses.some(
    (use) => use.habitId === habitId && use.date === today && use.powerId === "mare-calma"
  );
}

export function getMisses(habitId) {
  return getState()
    .misses.filter((miss) => miss.habitId === habitId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getMissForToday(habitId) {
  const today = todayKey();
  return getState().misses.find((miss) => miss.habitId === habitId && miss.date === today) || null;
}

// Motivo opcional de um dia admitido. Curto de propósito — pedir uma
// justificativa detalhada transformaria uma confissão em prestação de
// contas, e "prefiro não responder" precisa ser uma resposta tão válida
// quanto qualquer outra.
export const MISS_REASONS = [
  { id: "cansaco", label: "Cansaço" },
  { id: "tempo", label: "Falta de tempo" },
  { id: "dor", label: "Dor ou indisposição" },
  { id: "imprevisto", label: "Imprevisto" },
  { id: "outro", label: "Outro" },
  { id: "nao-responder", label: "Prefiro não responder" },
];

export function getMissReasonLabel(id) {
  return MISS_REASONS.find((reason) => reason.id === id)?.label || null;
}

export function declareMiss(habitId, { reason = null, note = null } = {}) {
  // Já cumpriu, ou já descansou: não há o que admitir hoje.
  if (isDoneToday(habitId) || hasRestDayToday(habitId)) return null;

  const today = todayKey();
  const outros = getState().misses.filter(
    (miss) => !(miss.habitId === habitId && miss.date === today)
  );
  const entry = {
    id: generateId("miss"),
    habitId,
    date: today,
    reason,
    note: note?.trim() || null,
  };
  setState({ misses: [...outros, entry] });
  return entry;
}

// Mudou de ideia, ou clicou sem querer: a admissão de hoje pode ser desfeita
// a qualquer momento, sem deixar marca — ela só existe enquanto for verdade.
export function undeclareMiss(habitId) {
  const today = todayKey();
  setState({
    misses: getState().misses.filter((miss) => !(miss.habitId === habitId && miss.date === today)),
  });
}

/*
  O nível sai do que foi feito, e não o contrário: quem correu 45 num plano de
  30 registrou um bônus, mesmo tendo digitado o valor à mão.
*/
export function levelForValue(habit, value) {
  if (value >= habit.missions.bonus) return "bonus";
  if (value >= habit.missions.main) return "main";
  return "minimal";
}

/*
  Registra a missão e devolve o que mudou, para a tela comemorar.

  value é o que aconteceu de verdade. Sem ele, assume-se a meta daquele nível
  — é o caminho rápido de um toque. Com ele, o histórico guarda o número real,
  que é a única forma de "225 min acumulados" significar alguma coisa.
*/
export function completeMission(habit, levelKey, value = null) {
  const realValue = value ?? habit.missions[levelKey];
  const level = MISSION_LEVELS[value === null ? levelKey : levelForValue(habit, realValue)];
  const effects = getActiveEffects(habit);

  /*
    Os poderes mexem no XP do registro, nunca no fato de ter acontecido: o
    dia só entra no histórico porque a pessoa cumpriu. A mínima valendo como
    principal continua sendo uma mínima no calendário.
  */
  let xpEarned = level.xp;
  if (effects.minimaValeComoPrincipal && level.key === "minimal") {
    xpEarned = MISSION_LEVELS.main.xp;
  }
  if (effects.dobraXp) xpEarned *= 2;
  // A evolução olha o XP da criatura (soma dos hábitos dela), não o do hábito.
  const previousXp = getAnimalXp(habit.animalId);
  const previouslyUnlocked = new Set(getUnlockedAnimals().map((animal) => animal.id));

  const log = {
    id: generateId("log"),
    habitId: habit.id,
    // Guardamos quem cuidava na hora: trocar de criatura não pode transferir
    // o esforço já feito para quem acabou de chegar.
    animalId: habit.animalId,
    date: todayKey(),
    time: new Date().toTimeString().slice(0, 5),
    level: level.key,
    value: realValue,
    xpEarned,
  };

  setState({ logs: [...getLogs(), log] });

  const newXp = previousXp + xpEarned;
  const previousStage = getStage(previousXp);
  const currentStage = getStage(newXp);

  return {
    xpEarned,
    previousStage,
    currentStage,
    evolved: currentStage.stage > previousStage.stage,
    unlockedAnimals: findNewlyUnlocked(previouslyUnlocked),
  };
}
