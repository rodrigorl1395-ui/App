// Companheiros: uma criatura cuida dos hábitos do domínio dela e fica forte
// com todos eles somados. A árvore continua sendo de cada hábito.
//
// Nada de XP guardado em campo próprio — tudo é derivado dos registros.
// Assim não existe o risco clássico de o contador e o histórico discordarem,
// e apagar um registro corrige o progresso sozinho.

import { getState } from "./state.js";
import { ANIMALS, CATEGORY_ELEMENT, CATEGORY_LABELS, getAnimalById } from "../data/animals.js";
import { getStage, getNextStage, getStageProgress, stageName } from "./evolution.js";
import { HABIT_TEMPLATES } from "../data/habits.js";
import { getPowerForElement } from "../data/powers.js";
import { todayKey } from "./utils.js";

// Nenhuma criatura se conquista antes de uma semana de jogo de verdade.
export const MIN_ACTIVE_DAYS = 7;

export function getHabitXp(habitId) {
  return getState()
    .logs.filter((log) => log.habitId === habitId)
    .reduce((total, log) => total + log.xpEarned, 0);
}

/*
  A criatura cresce com tudo que ela cuida, mas só com o que ela própria
  cumpriu: o registro guarda quem cuidava na época. Registros antigos, de
  antes desse campo existir, caem no dono atual do hábito.
*/
export function getAnimalXp(animalId) {
  const state = getState();
  const habitOwner = new Map(state.habits.map((habit) => [habit.id, habit.animalId]));

  return state.logs
    .filter((log) => (log.animalId ?? habitOwner.get(log.habitId)) === animalId)
    .reduce((total, log) => total + log.xpEarned, 0);
}

export function getHabitsOfAnimal(animalId) {
  return getState().habits.filter((habit) => habit.animalId === animalId);
}

export function getHabitOfAnimal(animalId) {
  return getState().habits.find((habit) => habit.animalId === animalId) || null;
}

/*
  Cada criatura cuida de um hábito só. Quem já tem o seu não aparece para um
  hábito novo — é isso que faz a pessoa construir aos poucos, conquistando uma
  criatura antes de assumir mais um compromisso.
*/
export function getAvailableAnimals() {
  const taken = new Set(getState().habits.map((habit) => habit.animalId));
  return getUnlockedAnimals().filter((animal) => !taken.has(animal.id));
}

// Dias distintos em que a pessoa registrou qualquer coisa: é o "tempo de jogo".
export function getActiveDays() {
  return new Set(getState().logs.map((log) => log.date)).size;
}

/*
  O nome que aparece em toda a interface — perfil, diálogo, Lar, missão —
  vem daqui: se a pessoa batizou o guardião, é o nome dela que se mostra; do
  contrário, o nome da espécie (Raposa, Axolote...) segue fazendo esse papel.
  species guarda o nome original para quem quiser dizer "sua Raposa" mesmo
  depois de batizada.

  Resolver aqui, uma vez só, é o que evita espalhar "habit.guardianName ||
  animal.name" pelos vinte e tantos lugares que já leem animal.name.
*/
function resolveAnimal(habit, animal) {
  if (!animal) return null;
  return { ...animal, species: animal.name, name: habit.guardianName || animal.name };
}

export function getCompanionState(habit) {
  const animal = resolveAnimal(habit, getAnimalById(habit.animalId));
  const xp = animal ? getAnimalXp(animal.id) : 0;
  const stage = getStage(xp);
  return {
    animal,
    xp,
    habitXp: getHabitXp(habit.id),
    stage,
    stageLabel: stageName(stage, animal?.gender),
    nextStage: getNextStage(xp),
    progress: getStageProgress(xp),
  };
}

/*
  Domínio de categoria: quantos dias distintos a pessoa cumpriu algum hábito
  daquela categoria. Contamos dias, não registros, para que cumprir três
  hábitos num dia só não valha como três dias de constância.
*/
export function getCategoryDays(category) {
  const state = getState();
  const habitIds = new Set(
    state.habits.filter((habit) => habit.category === category).map((habit) => habit.id)
  );

  const days = new Set(
    state.logs.filter((log) => habitIds.has(log.habitId)).map((log) => log.date)
  );

  return days.size;
}

export function isStarterChosen(animal) {
  return getState().user?.selectedAnimalId === animal.id;
}

function shiftDay(dateKey, delta) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + delta);
  return date.toISOString().slice(0, 10);
}

function gapDays(fromKey, toKey) {
  return Math.round((new Date(`${toKey}T00:00:00`) - new Date(`${fromKey}T00:00:00`)) / 86400000);
}

// A maior corrida de dias consecutivos dentro de um conjunto de datas
// distintas — o mesmo espírito de getBestStreak (stats.js), só que somando
// datas de vários hábitos em vez de um só.
function bestStreakFromDates(dates) {
  if (!dates.length) return 0;
  const marked = new Set(dates);
  let best = 0;
  let run = 0;
  let cursor = dates[0];
  const last = dates[dates.length - 1];
  while (cursor <= last) {
    if (marked.has(cursor)) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
    cursor = shiftDay(cursor, 1);
  }
  return best;
}

// Melhor sequência de dias em que pelo menos um hábito daquela categoria
// foi cumprido.
function getCategoryStreak(category) {
  const state = getState();
  const habitIds = new Set(
    state.habits.filter((habit) => habit.category === category).map((habit) => habit.id)
  );
  const dates = [...new Set(state.logs.filter((log) => habitIds.has(log.habitId)).map((log) => log.date))].sort();
  return bestStreakFromDates(dates);
}

// Melhor sequência de dias com QUALQUER hábito cumprido — a constância geral
// do Mestre, não presa a uma área.
function getGeneralStreak() {
  const dates = [...new Set(getState().logs.map((log) => log.date))].sort();
  return bestStreakFromDates(dates);
}

// Vezes que a pessoa voltou depois de sumir dois dias ou mais, somando o
// histórico inteiro — countReturns (quests.js) presa a um hábito, só que
// aqui é o Mestre como um todo.
function getReturnCount() {
  const dates = [...new Set(getState().logs.map((log) => log.date))].sort();
  let returns = 0;
  for (let i = 1; i < dates.length; i++) {
    if (gapDays(dates[i - 1], dates[i]) >= 2) returns++;
  }
  return returns;
}

function getReflectionCount() {
  return getState().logs.filter((log) => log.reflection).length;
}

function getPlanCount() {
  return getState().plans.length;
}

function getBonusCount() {
  return getState().logs.filter((log) => log.level === "bonus").length;
}

// Quantos elementos distintos tiveram algum registro nos últimos `days`
// dias — o equilíbrio de verdade, medido na janela mais recente.
function getRecentElementCount(days) {
  const state = getState();
  const categoryByHabit = new Map(state.habits.map((habit) => [habit.id, habit.category]));
  const cutoff = shiftDay(todayKey(), -days);
  const elements = new Set();
  for (const log of state.logs) {
    if (log.date < cutoff) continue;
    const element = CATEGORY_ELEMENT[categoryByHabit.get(log.habitId)];
    if (element) elements.add(element);
  }
  return elements.size;
}

// O número bruto de uma regra de desbloqueio, qualquer que seja o tipo.
function measureUnlockRule(rule) {
  switch (rule.type) {
    case "categoria":
      return getCategoryDays(rule.category);
    case "sequencia-categoria":
      return getCategoryStreak(rule.category);
    case "sequencia-geral":
      return getGeneralStreak();
    case "retorno":
      return getReturnCount();
    case "lembrancas":
      return getReflectionCount();
    case "combinados":
      return getPlanCount();
    case "bonus":
      return getBonusCount();
    case "equilibrio":
      return getRecentElementCount(rule.days || 7);
    default:
      return 0;
  }
}

function evaluateUnlockRule(rule) {
  const current = measureUnlockRule(rule);
  return { rule, current: Math.min(current, rule.amount), target: rule.amount, done: current >= rule.amount };
}

// A regra mais perto de se cumprir, entre os caminhos alternativos de um
// guardião. Se alguma já está pronta, é ela — senão, é a que tem a maior
// proporção andada, para a Santuário sempre mostrar o caminho mais aberto.
function closestUnlockRule(rules) {
  const evaluated = rules.map(evaluateUnlockRule);
  const done = evaluated.find((item) => item.done);
  if (done) return done;
  return evaluated.reduce((best, item) =>
    item.current / item.target > best.current / best.target ? item : best
  );
}

const RULE_LABELS = {
  categoria: (rule) => `dias de ${CATEGORY_LABELS[rule.category] || rule.category}`,
  "sequencia-categoria": (rule) => `dias seguidos de ${CATEGORY_LABELS[rule.category] || rule.category}`,
  "sequencia-geral": () => "dias seguidos, em qualquer hábito",
  retorno: () => "vezes voltando depois de sumir",
  lembrancas: () => "lembranças guardadas",
  combinados: () => "vezes combinando antes",
  bonus: () => "vezes indo além (bônus)",
  equilibrio: () => "áreas diferentes na mesma semana",
};

// A frase que descreve o caminho mais próximo — usada no Santuário para
// dizer não só "quanto falta", mas "falta o quê".
export function describeUnlockRule(rule) {
  return RULE_LABELS[rule.type]?.(rule) || "";
}

// Uma inicial só está disponível se foi A escolhida; as outras duas ficam
// perdidas para sempre, por isso nunca entram na conta de conquistáveis.
//
// As demais têm vários caminhos possíveis (animal.unlock é uma lista):
// nenhum guardião pertence a uma área só, basta UM caminho se cumprir.
export function isUnlocked(animal) {
  if (animal.starter) return isStarterChosen(animal);
  if (getActiveDays() < MIN_ACTIVE_DAYS) return false;
  return animal.unlock.some((rule) => measureUnlockRule(rule) >= rule.amount);
}

export function getUnlockedAnimals() {
  return ANIMALS.filter(isUnlocked);
}

export function getUnlockableAnimals() {
  return ANIMALS.filter((animal) => !animal.starter);
}

/*
  Estado de conquista de uma criatura, incluindo qual dos dois requisitos
  ainda falta — a semana de jogo ou o caminho mais próximo de se cumprir.
*/
export function getUnlockProgress(animal) {
  if (animal.starter) {
    return {
      kind: "starter",
      unlocked: isStarterChosen(animal),
      // As outras iniciais não são "ainda não", são "nunca".
      forfeited: !isStarterChosen(animal) && Boolean(getState().user?.selectedAnimalId),
    };
  }

  const activeDays = getActiveDays();
  const progress = closestUnlockRule(animal.unlock);

  return {
    kind: "earned",
    unlocked: activeDays >= MIN_ACTIVE_DAYS && progress.done,
    needsMorePlay: activeDays < MIN_ACTIVE_DAYS,
    activeDays,
    minActiveDays: MIN_ACTIVE_DAYS,
    current: progress.current,
    required: progress.target,
    ruleLabel: describeUnlockRule(progress.rule),
  };
}

/*
  Animais que passaram a estar disponíveis entre dois momentos. Usado logo
  depois de registrar uma missão, para avisar na hora da comemoração.
*/
export function findNewlyUnlocked(previouslyUnlockedIds) {
  return getUnlockedAnimals().filter((animal) => !previouslyUnlockedIds.has(animal.id));
}

export function getSuggestedElement(category) {
  return CATEGORY_ELEMENT[category] || null;
}

/*
  O que um guardião guarda: o poder dele e as áreas de hábito que cuida.
  Usado nas duas telas onde a pessoa escolhe entre guardiões — a escolha do
  inicial e o seletor de um hábito novo — para responder "o que ele faz por
  mim" antes de escolher, não só depois.
*/
export function getGuardianDomain(animal) {
  const power = getPowerForElement(animal.element);
  const matching = HABIT_TEMPLATES.filter(
    (item) => CATEGORY_ELEMENT[item.category] === animal.element
  );
  const categorias = [...new Set(matching.map((item) => CATEGORY_LABELS[item.category]))].join(" e ");
  return { power, categorias };
}
