// O Mestre é o jogador. Enquanto cada criatura conta a história de um hábito,
// este módulo junta tudo e responde: onde você está forte, onde está fraco.
//
// Como todo o resto, é leitura do histórico — não existe "nível do jogador"
// guardado em campo próprio.

import { getState } from "./state.js";
import { getHabits } from "./habits.js";
import { getHabitStats, habitDates } from "./stats.js";
import {
  getCompanionState,
  getUnlockableAnimals,
  getUnlockProgress,
  getActiveDays,
} from "./companion.js";
import { getMood } from "./mood.js";
import { getMissForToday } from "./missions.js";
import { todayKey } from "./utils.js";
import { CATEGORY_LABELS } from "../data/animals.js";
import { getTreeType } from "../data/trees.js";

/*
  O título do Mestre vem de dias em que a pessoa apareceu, não de XP. XP mede
  a criatura; presença mede o jogador. Os degraus seguem o que a pesquisa da
  Lally mostrou: um hábito se firma perto dos dois meses, não em 21 dias.
*/
export const MASTER_RANKS = [
  { rank: 1, name: "Aprendiz", minDays: 0 },
  { rank: 2, name: "Iniciado", minDays: 7 },
  { rank: 3, name: "Praticante", minDays: 21 },
  { rank: 4, name: "Constante", minDays: 66 },
  { rank: 5, name: "Veterano", minDays: 150 },
  { rank: 6, name: "Mestre", minDays: 365 },
];

export function getMasterRank(activeDays) {
  const current = MASTER_RANKS.reduce(
    (found, item) => (activeDays >= item.minDays ? item : found),
    MASTER_RANKS[0]
  );
  const next = MASTER_RANKS.find((item) => item.minDays > activeDays) || null;
  return {
    ...current,
    next,
    progress: next
      ? (activeDays - current.minDays) / (next.minDays - current.minDays)
      : 1,
  };
}

/*
  Vigor da árvore: o quanto ela está de pé. Sai do tempo desde o último dia
  cumprido, então quem rega com frequência mantém a copa cheia.

  Nunca chega a zero. A árvore murcha e adormece, mas não morre — perder tudo
  por sumir uma semana seria punir a pessoa exatamente quando ela mais precisa
  de um motivo para voltar.
*/
export function getTreeVigor(habitId) {
  const dates = habitDates(habitId);
  // Árvore recém-plantada não está murchando: ela ainda não foi regada uma vez.
  if (!dates.length) return null;

  // O descanso declarado também segura a árvore de pé: quem avisou que ia
  // descansar não sumiu.
  const restDays = getState()
    .powerUses.filter((use) => use.habitId === habitId && use.powerId === "mare-calma")
    .map((use) => use.date);

  const ultimo = [...dates, ...restDays].sort().pop();
  const dias = Math.round(
    (new Date(`${todayKey()}T00:00:00`) - new Date(`${ultimo}T00:00:00`)) / 86400000
  );

  if (dias <= 1) return 1;
  if (dias === 2) return 0.78;
  if (dias <= 4) return 0.55;
  if (dias <= 7) return 0.34;
  return 0.18;
}

/*
  Vigor para desenhar. A árvore recém-plantada (vigor null) é desenhada de pé:
  ela não está murchando, só ainda não foi regada uma vez. Murchar é o que
  acontece com quem já teve água e parou de receber.
*/
export function vigorAmount(vigor) {
  return vigor === null ? 1 : vigor;
}

export function describeVigor(vigor) {
  if (vigor === null) return "Recém-plantada, esperando a primeira rega";
  if (vigor >= 0.95) return "Viçosa, recém-regada";
  if (vigor >= 0.7) return "De pé, firme";
  if (vigor >= 0.5) return "Começando a murchar";
  if (vigor >= 0.3) return "Murcha, com sede";
  return "Adormecida, esperando você";
}

/*
  A frase que liga as duas pontas da ideia: cumprir o hábito é regar a árvore,
  e é da árvore que a criatura come. Sem botão de água em lugar nenhum — a
  água é o próprio dia cumprido.
*/
export function describeFeeding(animal, doneToday, vigor) {
  const nome = animal?.name || "Sua criatura";
  if (vigor === null)
    return `A árvore acabou de ser plantada. O primeiro dia cumprido é a primeira rega — e o primeiro fruto de ${nome}.`;
  if (doneToday) return `Você regou a árvore hoje. ${nome} está comendo os frutos dela.`;
  if (vigor >= 0.7) return `A árvore ainda está de pé. ${nome} tem o que comer, mas não por muito tempo.`;
  if (vigor >= 0.5) return `A árvore começou a murchar. ${nome} está rondando o tronco.`;
  if (vigor >= 0.3) return `A árvore está com sede. ${nome} espera embaixo dela.`;
  return `A árvore adormeceu. ${nome} dorme nas raízes — um dia cumprido acorda as duas.`;
}

// O estado da criatura agora, num bloco só: o que ela fez, como está e como
// anda a árvore de onde ela come.
export function getCreatureStatus(habit) {
  const companion = getCompanionState(habit);
  const stats = getHabitStats(habit);
  const vigor = getTreeVigor(habit.id);
  const doneToday = habitDates(habit.id).includes(todayKey());
  // Só faz sentido perguntar se ela admitiu quando ainda não cumpriu: cumprir
  // depois de admitir apaga a pergunta, não a admissão do histórico.
  const miss = doneToday ? null : getMissForToday(habit.id);

  return {
    animal: companion.animal,
    mood: getMood(habit.id),
    stageLabel: companion.stageLabel,
    doneToday,
    missToday: Boolean(miss),
    missNote: miss?.note || null,
    streak: stats.currentStreak,
    weekDays: stats.weekDays,
    weeklyTarget: stats.weeklyTarget,
    tree: getTreeType(habit.treeType),
    treeStage: stats.treeStage,
    vigor,
    vigorLabel: describeVigor(vigor),
    feeding: describeFeeding(companion.animal, doneToday, vigor),
  };
}

/*
  O retrato do Mestre. "Mais forte" e "mais fraco" saem da consistência de
  cada hábito, que é o que responde de verdade "onde eu estou indo bem" —
  quem registra muito num hábito velho não é necessariamente mais constante
  que quem registra pouco num recente.
*/
export function getMasterProfile() {
  const habits = getHabits();
  const state = getState();

  const areas = habits.map((habit) => {
    const stats = getHabitStats(habit);
    const companion = getCompanionState(habit);
    const vigor = getTreeVigor(habit.id);
    return {
      habit,
      animal: companion.animal,
      stageLabel: companion.stageLabel,
      progress: companion.progress,
      consistency: stats.consistency,
      activeDays: stats.activeDays,
      xp: companion.xp,
      streak: stats.currentStreak,
      bestStreak: stats.bestStreak,
      doneToday: habitDates(habit.id).includes(todayKey()),
      vigor,
      vigorLabel: describeVigor(vigor),
      categoryLabel: CATEGORY_LABELS[habit.category] || habit.category,
    };
  });

  const porConsistencia = [...areas].sort((a, b) => b.consistency - a.consistency);
  const porXp = [...areas].sort((a, b) => b.xp - a.xp);

  const activeDays = getActiveDays();

  return {
    habits: habits.length,
    rank: getMasterRank(activeDays),
    totalXp: state.logs.reduce((total, log) => total + log.xpEarned, 0),
    activeDays,
    conquistadas: getUnlockableAnimals().filter((animal) => getUnlockProgress(animal).unlocked)
      .length,
    conquistaveis: getUnlockableAnimals().length,
    frutos: state.logs.filter((log) => log.reflection).length,
    achados: state.collected.length,
    bestStreak: areas.reduce((max, area) => Math.max(max, area.bestStreak), 0),
    regadasHoje: areas.filter((area) => area.doneToday).length,
    areas,
    // Só faz sentido falar em mais forte e mais fraco com mais de uma área.
    maisDesenvolvida: porXp[0] || null,
    maisForte: areas.length > 1 ? porConsistencia[0] : null,
    maisFraca: areas.length > 1 ? porConsistencia[porConsistencia.length - 1] : null,
  };
}
