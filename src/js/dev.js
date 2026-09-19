/*
  Modo dev: gera e envelhece dados reais só para testar o app mais rápido.
  Nada aqui inventa um contador — cada dia simulado é um registro de
  verdade, com os mesmos campos que um toque real produziria, só retroativo
  e marcado com dev:true, para poder ser removido de novo sem tocar no
  resto do histórico. XP, sementes, sequência e evolução continuam saindo
  só daqui, do jeito que já saíam antes do modo dev existir.
*/

import { getState, setState } from "./state.js";
import { getHabits } from "./habits.js";
import { generateId, todayKey } from "./utils.js";
import { MISSION_LEVELS } from "./missions.js";

export const DEV_PASSWORD = "dev777";

export function checkDevPassword(input) {
  return input === DEV_PASSWORD;
}

function daysAgoKey(days) {
  const d = new Date(`${todayKey()}T00:00:00`);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function shiftDateKey(dateKey, days) {
  if (!dateKey) return dateKey;
  const d = new Date(`${dateKey}T00:00:00`);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function shiftIso(iso, days) {
  if (!iso) return iso;
  const d = new Date(iso);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

/*
  Preenche dias passados como se tivessem sido cumpridos de verdade — missão
  principal, mesmo XP que um toque real daria. Nunca mexe em hoje nem
  sobrescreve um dia que já tem registro.
*/
export function simulateDays(habitId, days, { withReflections = true } = {}) {
  const state = getState();
  const habits = habitId === "all" ? getHabits() : getHabits().filter((h) => h.id === habitId);
  if (!habits.length || days < 1) return { added: 0 };

  const existing = new Set(state.logs.map((log) => `${log.habitId}:${log.date}`));
  const added = [];

  habits.forEach((habit) => {
    for (let i = days; i >= 1; i--) {
      const date = daysAgoKey(i);
      if (existing.has(`${habit.id}:${date}`)) continue;
      const withFruit = withReflections && i % 3 === 0;
      added.push({
        id: generateId("log"),
        habitId: habit.id,
        animalId: habit.animalId,
        date,
        time: "08:00",
        level: "main",
        value: habit.missions.main,
        xpEarned: MISSION_LEVELS.main.xp,
        reflection: withFruit ? "Registro de teste gerado pelo modo dev." : undefined,
        feeling: withFruit ? "normal" : undefined,
        dev: true,
      });
    }
  });

  if (added.length) setState({ logs: [...state.logs, ...added] });
  return { added: added.length };
}

export function getDevLogCount() {
  return getState().logs.filter((log) => log.dev).length;
}

// Remove só o que o próprio modo dev criou — o resto do histórico não sente.
export function clearDevData() {
  const state = getState();
  const removed = state.logs.filter((log) => log.dev).length;
  setState({ logs: state.logs.filter((log) => !log.dev) });
  return { removed };
}

/*
  Adianta todo o histórico N dias — não inventa nenhum dia cumprido, só
  envelhece o que já existe. É o jeito de testar o que acontece quando o
  tempo passa de verdade: árvore com sede, sequência esfriada, mês seguinte
  no calendário — sem esperar os dias de verdade acontecerem. Reversível
  restaurando um backup baixado antes (a seção "Seus dados" logo acima).
*/
export function advanceTime(days) {
  if (!(days >= 1)) return;
  const state = getState();
  setState({
    habits: state.habits.map((h) => ({ ...h, createdAt: shiftIso(h.createdAt, days) })),
    logs: state.logs.map((log) => ({ ...log, date: shiftDateKey(log.date, days) })),
    plans: state.plans.map((plan) => ({ ...plan, date: shiftDateKey(plan.date, days) })),
    misses: state.misses.map((miss) => ({ ...miss, date: shiftDateKey(miss.date, days) })),
    powerUses: state.powerUses.map((use) => ({ ...use, date: shiftDateKey(use.date, days) })),
    garden: state.garden.map((item) => ({ ...item, plantedAt: shiftIso(item.plantedAt, days) })),
    collected: state.collected.map((item) => ({ ...item, collectedAt: shiftIso(item.collectedAt, days) })),
    user: state.user ? { ...state.user, createdAt: shiftIso(state.user.createdAt, days) } : state.user,
    meta: { ...state.meta, firstOpenedAt: shiftIso(state.meta.firstOpenedAt, days) },
  });
}
