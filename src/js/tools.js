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
import { getSeedsAvailable } from "./seeds.js";

export function getObtainedTools() {
  return getState().tools;
}

export function isObtained(id) {
  return getObtainedTools().some((item) => item.toolId === id);
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

// Tudo que já foi obtido, com o conteúdo real anexado — o que a tela de
// Ferramentas mostra.
export function getOwnedTools() {
  return getObtainedTools()
    .map((obtained) => ({ ...obtained, tool: getToolItem(obtained.toolId) }))
    .filter((item) => item.tool);
}
