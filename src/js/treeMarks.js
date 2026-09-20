/*
  A marca no tronco: puramente cosmética, uma escolha guardada — do mesmo
  jeito que plantar um item no Jardim. Não mexe em XP, sequência nem vigor;
  é só a assinatura de quem cuida daquela árvore.

  Uma marca ativa por hábito: gravar outra substitui a anterior, em vez de
  empilhar — um tronco cheio de marcas de teste não conta história nenhuma.
*/

import { getState, setState } from "./state.js";
import { generateId } from "./utils.js";

export const TREE_MARK_OPTIONS = [
  { id: "coracao", icon: "heart", label: "Coração" },
  { id: "estrela", icon: "star", label: "Estrela" },
  { id: "lua", icon: "moon", label: "Lua" },
  { id: "chama", icon: "flame", label: "Chama" },
  { id: "folha", icon: "leaf", label: "Folha" },
  { id: "faisca", icon: "spark", label: "Faísca" },
];

export function getTreeMarkOption(markId) {
  return TREE_MARK_OPTIONS.find((option) => option.id === markId) || null;
}

export function getTreeMark(habitId) {
  const marca = getState().treeMarks.find((item) => item.habitId === habitId);
  return marca ? getTreeMarkOption(marca.markId) : null;
}

// markId null apaga a marca — gravar de novo é sempre uma escolha, inclusive
// a de deixar o tronco limpo outra vez.
export function setTreeMark(habitId, markId) {
  const resto = getState().treeMarks.filter((item) => item.habitId !== habitId);
  if (!markId) {
    setState({ treeMarks: resto });
    return;
  }
  setState({
    treeMarks: [
      ...resto,
      { id: generateId("marca"), habitId, markId, markedAt: new Date().toISOString() },
    ],
  });
}
