/*
  Ferramentas obtidas: uma escolha da pessoa, como collected e garden — o
  direito de obter é que é derivado (a loja olha as sementes; o achado olha
  o histórico do hábito), a obtenção em si precisa ser lembrada.
*/

import { getState, setState } from "./state.js";
import { getHabits } from "./habits.js";
import { generateId } from "./utils.js";
import { evaluateGoal } from "./quests.js";
import { TOOLS, getToolItem } from "../data/tools.js";
import { GUARDIAN_APP } from "../data/guardians.js";
import { getAnimalById } from "../data/animals.js";
import { getSeedsAvailable } from "./seeds.js";

export function getObtainedTools() {
  return getState().tools;
}

/*
  Os guardiões que você já tem: o inicial escolhido e os que foram
  conquistados e postos para cuidar de um hábito.
*/
function guardioesDaCasa() {
  const state = getState();
  const ids = new Set(state.habits.map((habit) => habit.animalId).filter(Boolean));
  if (state.user?.selectedAnimalId) ids.add(state.user.selectedAnimalId);
  return ids;
}

/*
  Cada guardião traz o app dele no primeiro dia — não depois de uma semana
  de constância, não por sementes. Escolher a raposa é ganhar a academia
  junto; conquistar a coruja abre o radar de compras na hora.

  É o que faz a escolha do inicial valer alguma coisa no primeiro minuto,
  em vez de render só um bichinho bonito e uma barra vazia.
*/
export function isObtained(id) {
  if (getObtainedTools().some((item) => item.toolId === id)) return true;
  const donos = guardioesDaCasa();
  return Object.entries(GUARDIAN_APP).some(([guardiao, app]) => app === id && donos.has(guardiao));
}

// De quem veio este app, quando veio de guardião. A tela usa para dizer
// "a Raposa trouxe" em vez de deixar o app aparecer do nada.
export function guardianOfTool(id) {
  const donos = guardioesDaCasa();
  const par = Object.entries(GUARDIAN_APP).find(([guardiao, app]) => app === id && donos.has(guardiao));
  return par ? getAnimalById(par[0]) : null;
}

/*
  Catálogo da loja: só as ferramentas de source "loja", com o que já dá pra
  pagar. As de "achado" não aparecem aqui — elas se destravam sozinhas, não
  se compram.
*/
export function getShopCatalog() {
  const available = getSeedsAvailable();
  return TOOLS.filter((tool) => tool.source === "loja").map((tool) => ({
    ...tool,
    obtained: isObtained(tool.id),
    affordable: available >= tool.cost,
  }));
}

export function buyTool(id) {
  const tool = getToolItem(id);
  if (!tool || tool.source !== "loja" || isObtained(id)) return null;
  if (getSeedsAvailable() < tool.cost) return null;

  const obtained = { id: generateId("tool"), toolId: id, source: "loja", obtainedAt: new Date().toISOString() };
  setState({ tools: [...getObtainedTools(), obtained] });
  return obtained;
}

/*
  Ferramentas de "achado": destravam quando algum hábito daquela categoria
  cumpre o requisito, do mesmo jeito que um achado de criatura — o hábito que
  destravou fica registrado, para a história fazer sentido depois.
*/
function habitsOfCategory(category) {
  return getHabits().filter((habit) => habit.category === category);
}

export function getPendingTool() {
  const achados = TOOLS.filter((tool) => tool.source === "achado" && !isObtained(tool.id));
  for (const tool of achados) {
    const pronto = habitsOfCategory(tool.category).find(
      (habit) => evaluateGoal(tool.requires, habit).done
    );
    if (pronto) return { tool, habit: pronto };
  }
  return null;
}

export function collectTool(toolId, habitId) {
  if (isObtained(toolId)) return null;
  const obtained = {
    id: generateId("tool"),
    toolId,
    source: "achado",
    habitId,
    obtainedAt: new Date().toISOString(),
  };
  setState({ tools: [...getObtainedTools(), obtained] });
  return obtained;
}

/*
  Tudo que já é seu, com o conteúdo real anexado — o que a gaveta de Apps
  mostra. Duas origens numa lista só: o que você comprou ou achou, e o que
  cada guardião da casa trouxe consigo. Sem a segunda metade, o app do
  guardião abria pela rota mas não aparecia na gaveta — existia e não
  existia ao mesmo tempo.
*/
export function getOwnedTools() {
  const conquistadas = getObtainedTools()
    .map((obtained) => ({ ...obtained, tool: getToolItem(obtained.toolId) }))
    .filter((item) => item.tool);

  const jaNaLista = new Set(conquistadas.map((item) => item.toolId));
  const deGuardiao = [...guardioesDaCasa()]
    .map((guardianId) => ({ guardianId, toolId: GUARDIAN_APP[guardianId] }))
    .filter((par) => par.toolId && !jaNaLista.has(par.toolId))
    .map((par) => ({
      id: `guardiao_${par.guardianId}`,
      toolId: par.toolId,
      source: "guardiao",
      guardianId: par.guardianId,
      tool: getToolItem(par.toolId),
    }))
    .filter((item) => item.tool);

  return [...conquistadas, ...deGuardiao];
}
