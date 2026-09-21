/*
  Apps — a casa das ferramentas.

  Uma ferramenta obtida não é um texto guardado numa lista: é um app que
  passa a existir no aparelho. Esta tela é a gaveta deles — cada um com o
  seu ícone e uma linha dizendo como você está indo nele agora, não o que
  ele promete fazer.

  Embaixo, o que ainda não é seu: o que se compra com sementes e o que se
  destrava cumprindo hábito.
*/

import { createEl, showToolFound, showSheet } from "../ui.js";
import { createIcon } from "../icons.js";
import { navigate, refresh } from "../router.js";
import { getCompanionState } from "../companion.js";
import { CATEGORY_LABELS } from "../../data/animals.js";
import { getSeedsAvailable } from "../seeds.js";
import { TOOLS } from "../../data/tools.js";
import { getShopCatalog, buyTool, getOwnedTools, getPendingTool, collectTool, isObtained } from "../tools.js";

import { getWeekCount } from "../apps/gym.js";
import { getMonthSummary, formatarValor } from "../apps/money.js";
import { getPendingCount } from "../apps/journal.js";
import { getWeekPages } from "../apps/reading.js";
import { getAlarms } from "../apps/alarm.js";
import { getTodayMinutes } from "../apps/focusMode.js";
import { getUpcoming } from "../apps/agenda.js";
import { getActiveGoals } from "../apps/goals.js";
import { getGoal as getSavingsGoal, getSaldo } from "../apps/piggybank.js";
import { getGoal as getCalorieGoal, getDayTotal } from "../apps/calories.js";

/*
  A linha de status de cada app: o número que importa nele hoje. É o que
  transforma uma gaveta de ícones em algo que se olha de manhã.
*/
function statusDoApp(toolId) {
  if (toolId === "coach-academia") {
    const treinos = getWeekCount();
    return treinos ? `${treinos} ${treinos === 1 ? "treino" : "treinos"} em 7 dias` : "Nenhum treino esta semana";
  }
  if (toolId === "radar-compras") {
    const { total } = getMonthSummary();
    return total ? `${formatarValor(total)} este mês` : "Nada lançado este mês";
  }
  if (toolId === "bullet-journal") {
    const abertas = getPendingCount();
    return abertas ? `${abertas} ${abertas === 1 ? "tarefa aberta" : "tarefas abertas"}` : "Dia em dia";
  }
  if (toolId === "apoiador-leitura") {
    const paginas = getWeekPages();
    return paginas ? `${paginas} páginas em 7 dias` : "Nenhuma leitura esta semana";
  }
  if (toolId === "despertador") {
    const ligados = getAlarms().filter((alarme) => alarme.enabled).length;
    return ligados ? `${ligados} ${ligados === 1 ? "alarme ligado" : "alarmes ligados"}` : "Nenhum alarme ligado";
  }
  if (toolId === "foco-total") {
    const minutos = getTodayMinutes();
    return minutos ? `${minutos} min em foco hoje` : "Nenhum bloco hoje";
  }
  if (toolId === "agenda") {
    const proximos = getUpcoming().length;
    return proximos ? `${proximos} ${proximos === 1 ? "compromisso" : "compromissos"} por vir` : "Nada marcado";
  }
  if (toolId === "metas") {
    const ativas = getActiveGoals().length;
    return ativas ? `${ativas} ${ativas === 1 ? "meta ativa" : "metas ativas"}` : "Nenhuma meta ainda";
  }
  if (toolId === "cofrinho") {
    const meta = getSavingsGoal();
    return meta ? `${formatarValor(getSaldo())} guardado` : "Sem meta ainda";
  }
  if (toolId === "calculadora-calorias") {
    const meta = getCalorieGoal();
    return meta ? `${getDayTotal()}/${meta} kcal hoje` : "Sem meta ainda";
  }
  return "";
}

export function renderToolsScreen() {
  const pendente = getPendingTool();
  if (pendente) {
    const companion = getCompanionState(pendente.habit);
    requestAnimationFrame(() => {
      showToolFound(pendente.tool, pendente.habit, companion.animal, () => {
        collectTool(pendente.tool.id, pendente.habit.id);
        refresh();
      });
    });
  }

  const meus = getOwnedTools();

  return createEl("div", {
    className: "screen",
    children: [
      createEl("div", {
        className: "screen-header",
        children: [createEl("h1", { className: "section-title", text: "Apps" })],
      }),
      createEl("p", {
        className: "tree-hint",
        text: "Cada ferramenta conquistada vira um app de verdade aqui dentro.",
      }),

      meus.length ? renderGaveta(meus) : renderGavetaVazia(),
      renderPorVir(),
    ],
  });
}

function renderGaveta(meus) {
  return createEl("div", {
    className: "app-grid",
    children: meus.map((item) => {
      const tool = item.tool;
      const tile = createEl("button", {
        className: "app-tile",
        attrs: { type: "button", style: `--color-app: ${corDoApp(tool.id)}` },
        children: [
          createEl("span", {
            className: "app-tile-icon",
            children: [createIcon(tool.app?.icon || tool.icon)],
          }),
          createEl("span", { className: "app-tile-name", text: tool.name }),
          createEl("span", { className: "app-tile-status", text: statusDoApp(tool.id) }),
        ],
      });
      tile.addEventListener("click", () => navigate(tool.app?.route || "/ferramentas"));
      return tile;
    }),
  });
}

const CORES = {
  "coach-academia": "#e0705f",
  "radar-compras": "#6fb8d1",
  "bullet-journal": "#9b8cfa",
  "apoiador-leitura": "#6db3f2",
  despertador: "#f2b84e",
  "foco-total": "#9b8cfa",
  agenda: "#6db3f2",
  metas: "#e2a23f",
  cofrinho: "#8fae5c",
  "calculadora-calorias": "#e2543f",
};

function corDoApp(id) {
  return CORES[id] || "#8fae5c";
}

function renderGavetaVazia() {
  return createEl("section", {
    className: "card",
    children: [
      createEl("h2", { className: "card-title", text: "Nenhum app ainda." }),
      createEl("p", {
        className: "card-subtitle",
        text: "Compre uma ferramenta com sementes, ou cumpra um hábito com constância — algumas aparecem sozinhas.",
      }),
    ],
  });
}

/*
  O que ainda não é seu. As duas origens ficam na mesma lista porque a
  pergunta de quem olha é uma só ("o que mais existe?"), e cada linha diz
  como se chega lá.
*/
function renderPorVir() {
  const sementes = getSeedsAvailable();
  const loja = getShopCatalog().filter((item) => !item.obtained);
  const achados = TOOLS.filter((tool) => tool.source === "achado" && !isObtained(tool.id));

  if (!loja.length && !achados.length) return null;

  return createEl("section", {
    className: "card",
    children: [
      createEl("div", {
        className: "app-card-head",
        children: [
          createEl("h2", { className: "card-title", text: "Por destravar" }),
          createEl("span", {
            className: "badge",
            text: `${sementes} ${sementes === 1 ? "semente" : "sementes"}`,
          }),
        ],
      }),
      createEl("div", {
        className: "app-list",
        children: [
          ...loja.map((item) => renderLinhaLoja(item)),
          ...achados.map((tool) => renderLinhaAchado(tool)),
        ],
      }),
    ],
  });
}

function renderLinhaLoja(item) {
  const botao = createEl("button", {
    className: "button button-secondary shop-buy",
    text: item.affordable ? `Obter · ${item.cost}` : `${item.cost}`,
    attrs: { type: "button" },
  });
  botao.disabled = !item.affordable;
  botao.addEventListener("click", () => {
    buyTool(item.id);
    refresh();
  });

  const linha = createEl("div", {
    className: "app-row is-locked",
    children: [
      createEl("span", {
        className: "app-row-icon",
        attrs: { style: `--color-app: ${corDoApp(item.id)}` },
        children: [createIcon(item.app?.icon || item.icon)],
      }),
      createEl("div", {
        className: "app-row-body",
        children: [
          createEl("span", { className: "app-row-name", text: item.name }),
          createEl("span", { className: "app-row-note", text: item.app?.tagline || item.story }),
        ],
      }),
      botao,
    ],
  });
  return linha;
}

function renderLinhaAchado(tool) {
  const linha = createEl("button", {
    className: "app-row is-locked",
    attrs: { type: "button" },
    children: [
      createEl("span", {
        className: "app-row-icon",
        attrs: { style: `--color-app: ${corDoApp(tool.id)}` },
        children: [createIcon(tool.app?.icon || tool.icon)],
      }),
      createEl("div", {
        className: "app-row-body",
        children: [
          createEl("span", { className: "app-row-name", text: tool.name }),
          createEl("span", {
            className: "app-row-note",
            text: `Aparece sozinha: ${descreverRequisito(tool)}`,
          }),
        ],
      }),
    ],
  });
  linha.addEventListener("click", () =>
    showSheet({
      title: tool.name,
      subtitle: tool.app?.tagline,
      content: [createEl("p", { className: "sheet-speech", text: `"${tool.story}"` })],
      actions: [
        {
          label: `Como destravar: ${descreverRequisito(tool)}`,
          disabled: true,
          onClick: () => {},
        },
      ],
    })
  );
  return linha;
}

function descreverRequisito(tool) {
  const area = CATEGORY_LABELS[tool.category] || tool.category;
  if (tool.requires?.type === "sequencia") {
    return `${tool.requires.amount} dias seguidos de ${area}`;
  }
  if (tool.requires?.type === "dias") {
    return `${tool.requires.amount} dias de ${area}`;
  }
  return `constância em ${area}`;
}
