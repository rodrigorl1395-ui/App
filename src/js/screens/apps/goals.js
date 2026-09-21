/*
  Metas — a tela do app.

  Cada meta é um cartão com barra de progresso; tocar nele abre a folha de
  check-in. Metas concluídas ficam numa lista à parte, quieta — não somem,
  porque terminar uma é a prova de que o método funciona.
*/

import { createEl, showSheet } from "../../ui.js";
import { refresh } from "../../router.js";
import { appShell, appCard, statGrid, textInput, fieldRow, iconButton, emptyHint, methodCard, progressBar } from "./kit.js";
import {
  getActiveGoals,
  getCompletedGoals,
  addGoal,
  removeGoal,
  addCheckin,
  getProgress,
  diasRestantes,
} from "../../apps/goals.js";

const ACCENT = "#e2a23f";

export function renderGoalsApp() {
  const ativas = getActiveGoals();
  const concluidas = getCompletedGoals();

  return appShell({
    title: "Metas",
    subtitle: "Objetivos com número e prazo",
    icon: "target",
    accent: ACCENT,
    children: [
      statGrid([
        { value: ativas.length, label: "em andamento" },
        { value: concluidas.length, label: "concluídas" },
      ]),

      appCard({
        title: "Em andamento",
        action: iconButton("plus", abrirNovaMeta, { label: "Nova meta" }),
        children: ativas.length ? ativas.map(renderMeta) : [emptyHint("Nenhuma meta ainda. Crie uma com o + acima.")],
      }),

      concluidas.length
        ? appCard({
            title: "Concluídas",
            children: [
              createEl("div", {
                className: "app-list is-quiet",
                children: concluidas.map((meta) =>
                  createEl("div", {
                    className: "app-row",
                    children: [
                      createEl("div", {
                        className: "app-row-body",
                        children: [
                          createEl("span", { className: "app-row-name", text: meta.title }),
                          createEl("span", {
                            className: "app-row-note",
                            text: `${meta.targetValue} ${meta.unit}`,
                          }),
                        ],
                      }),
                    ],
                  })
                ),
              }),
            ],
          })
        : null,

      methodCard("metas"),
    ],
  });
}

function renderMeta(meta) {
  const { total, ratio } = getProgress(meta);
  const restantes = diasRestantes(meta);

  const cartao = createEl("button", {
    className: "card goal-card",
    attrs: { type: "button" },
    children: [
      createEl("div", {
        className: "app-card-head",
        children: [
          createEl("h3", { className: "card-title", text: meta.title }),
          createEl("span", { className: "app-row-value", text: `${total}/${meta.targetValue} ${meta.unit}` }),
        ],
      }),
      progressBar(ratio, { color: ACCENT }),
      restantes != null
        ? createEl("span", {
            className: "app-row-note",
            text: restantes < 0 ? "Prazo vencido" : restantes === 0 ? "É hoje" : `${restantes} dias restantes`,
          })
        : null,
    ],
  });
  cartao.addEventListener("click", () => abrirCheckin(meta));
  return cartao;
}

function abrirCheckin(meta) {
  const valor = textInput({ placeholder: `Quanto, em ${meta.unit}?`, type: "number", inputmode: "decimal" });
  const nota = textInput({ placeholder: "Nota (opcional)" });

  showSheet({
    title: meta.title,
    subtitle: "Registre o quanto avançou desde o último check-in.",
    content: [fieldRow([valor]), nota],
    actions: [
      {
        label: "Registrar check-in",
        primary: true,
        onClick: () => {
          addCheckin(meta.id, { amount: valor.value, note: nota.value });
          refresh();
        },
      },
      {
        label: "Apagar meta",
        onClick: () => {
          removeGoal(meta.id);
          refresh();
        },
      },
    ],
  });
}

function abrirNovaMeta() {
  const titulo = textInput({ placeholder: "O que você quer alcançar?" });
  const valor = textInput({ placeholder: "Alvo (ex.: 10)", type: "number", inputmode: "decimal" });
  const unidade = textInput({ placeholder: "Unidade (ex.: km, livros, R$)" });
  const prazo = textInput({ type: "date" });

  showSheet({
    title: "Nova meta",
    subtitle: "Um número e, se fizer sentido, um prazo.",
    content: [titulo, fieldRow([valor, unidade]), prazo],
    actions: [
      {
        label: "Criar meta",
        primary: true,
        onClick: () => {
          if (!addGoal({ title: titulo.value, targetValue: valor.value, unit: unidade.value, targetDate: prazo.value }))
            return;
          refresh();
        },
      },
    ],
  });
}
