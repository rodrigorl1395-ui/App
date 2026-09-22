/*
  Calculadora de Calorias — a tela do app.

  Meta do dia, o quanto já entrou, e o quanto falta — nessa ordem, porque é
  a pergunta que se faz antes da próxima refeição. Sem meta definida, a
  tela pede uma antes de mostrar barra nenhuma.
*/

import { createEl, showSheet } from "../../ui.js";
import { refresh } from "../../router.js";
import { appShell, appCard, statGrid, textInput, fieldRow, primaryButton, iconButton, emptyHint, methodCard, progressBar } from "./kit.js";
import { getGoal, setGoalKcal, getDayLogs, addLog, removeLog, getDayTotal, getWeekAverage } from "../../apps/calories.js";

const ACCENT = "#e2543f";

export function renderCaloriesApp() {
  const meta = getGoal();
  const total = getDayTotal();
  const logs = getDayLogs();
  const media = getWeekAverage();
  const ratio = meta ? total / meta : 0;

  return appShell({
    title: "Calculadora de Calorias",
    subtitle: "O que entrou hoje, contra a meta",
    icon: "apple",
    accent: ACCENT,
    children: [
      meta
        ? appCard({
            title: "Hoje",
            action: iconButton("plus", () => abrirEditarMeta(meta), { label: "Editar meta" }),
            children: [
              statGrid([
                { value: total, label: "kcal hoje" },
                { value: Math.max(0, meta - total), label: "kcal restantes" },
                { value: media || "—", label: "média em 7 dias" },
              ]),
              progressBar(ratio, { color: ratio > 1 ? "#e0705f" : ACCENT }),
              createEl("span", {
                className: "app-row-note",
                text: ratio > 1 ? `${Math.round((ratio - 1) * 100)}% acima da meta` : `Meta: ${meta} kcal`,
              }),
            ],
          })
        : appCard({
            title: "Qual a sua meta diária?",
            children: [renderFormMeta()],
          }),

      appCard({
        title: "Refeições de hoje",
        action: iconButton("plus", abrirNovaRefeicao, { label: "Adicionar refeição" }),
        children: logs.length
          ? [createEl("div", { className: "app-list", children: logs.map(renderLog) })]
          : [emptyHint("Nada lançado hoje. Adicione com o + acima.")],
      }),

      methodCard("calculadora-calorias"),
    ],
  });
}

function renderFormMeta() {
  const meta = textInput({ placeholder: "Meta diária (kcal)", type: "number", inputmode: "numeric" });
  return createEl("div", {
    className: "app-field-row",
    children: [
      meta,
      primaryButton("Salvar", () => {
        if (!Number(meta.value)) return;
        setGoalKcal(meta.value);
        refresh();
      }, { block: false }),
    ],
  });
}

function renderLog(log) {
  return createEl("div", {
    className: "app-row",
    children: [
      createEl("div", {
        className: "app-row-body",
        children: [createEl("span", { className: "app-row-name", text: log.name })],
      }),
      createEl("span", { className: "app-row-value", text: `${log.kcal} kcal` }),
      iconButton("trash", () => {
        removeLog(log.id);
        refresh();
      }, { label: "Apagar refeição", danger: true }),
    ],
  });
}

function abrirNovaRefeicao() {
  const nome = textInput({ placeholder: "O quê? (ex.: Almoço)" });
  const kcal = textInput({ placeholder: "kcal (estimativa vale)", type: "number", inputmode: "numeric" });

  showSheet({
    title: "Nova refeição",
    content: [nome, fieldRow([kcal])],
    actions: [
      {
        label: "Adicionar",
        primary: true,
        onClick: () => {
          if (!addLog({ name: nome.value, kcal: kcal.value })) return;
          refresh();
        },
      },
    ],
  });
}

function abrirEditarMeta(metaAtual) {
  const meta = textInput({ placeholder: "Meta diária (kcal)", type: "number", inputmode: "numeric", value: String(metaAtual) });

  showSheet({
    title: "Meta diária",
    content: [meta],
    actions: [
      {
        label: "Salvar",
        primary: true,
        onClick: () => {
          if (!Number(meta.value)) return;
          setGoalKcal(meta.value);
          refresh();
        },
      },
    ],
  });
}
