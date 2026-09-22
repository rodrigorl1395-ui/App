/*
  Cofrinho — a tela do app.

  Sem meta definida, a tela só pede uma. Com meta, um pote que enche de
  baixo pra cima (a mesma lógica visual da barra de progresso, só vertical)
  e a lista de depósitos e retiradas por trás do número.
*/

import { createEl, showSheet } from "../../ui.js";
import { refresh } from "../../router.js";
import { appShell, appCard, statGrid, textInput, fieldRow, chipPicker, primaryButton, iconButton, emptyHint, methodCard, dataCurta } from "./kit.js";
import { formatarValor } from "../../apps/money.js";
import {
  getGoal,
  setGoal,
  getEntries,
  addEntry,
  removeEntry,
  getSaldo,
  getRatio,
} from "../../apps/piggybank.js";

const ACCENT = "#8fae5c";

export function renderPiggybankApp() {
  const meta = getGoal();
  return meta ? renderComMeta(meta) : renderSemMeta();
}

function renderSemMeta() {
  const titulo = textInput({ placeholder: "Pra quê? (ex.: Viagem em dezembro)" });
  const valor = textInput({ placeholder: "Quanto custa?", type: "number", inputmode: "decimal" });

  return appShell({
    title: "Cofrinho",
    subtitle: "Uma meta de valor, guardada aos poucos",
    icon: "piggybank",
    accent: ACCENT,
    children: [
      appCard({
        title: "Qual é o objetivo?",
        children: [
          titulo,
          valor,
          primaryButton("Começar a guardar", () => {
            if (!setGoal({ title: titulo.value, targetAmount: valor.value })) return;
            refresh();
          }, { icon: "plus" }),
        ],
      }),
      methodCard("cofrinho"),
    ],
  });
}

function renderComMeta(meta) {
  const saldo = getSaldo();
  const ratio = getRatio();
  const lancamentos = getEntries();

  return appShell({
    title: "Cofrinho",
    subtitle: meta.title,
    icon: "piggybank",
    accent: ACCENT,
    children: [
      createEl("div", {
        className: "jar-wrap",
        children: [
          createEl("div", {
            className: "jar",
            children: [createEl("div", { className: "jar-fill", attrs: { style: `height: ${Math.max(3, ratio * 100)}%` } })],
          }),
          createEl("span", { className: "jar-caption", text: `${Math.round(ratio * 100)}% guardado` }),
        ],
      }),

      statGrid([
        { value: formatarValor(saldo), label: "guardado" },
        { value: formatarValor(Math.max(0, meta.targetAmount - saldo)), label: "falta" },
        { value: formatarValor(meta.targetAmount), label: "meta" },
      ]),

      appCard({
        title: "Lançar",
        action: iconButton("plus", abrirLancamento, { label: "Novo lançamento" }),
        children: lancamentos.length
          ? [createEl("div", { className: "app-list", children: lancamentos.map(renderLancamento) })]
          : [emptyHint("Nada guardado ainda. Lance o primeiro depósito com o + acima.")],
      }),

      methodCard("cofrinho"),
    ],
  });
}

function renderLancamento(entrada) {
  return createEl("div", {
    className: "app-row",
    children: [
      createEl("div", {
        className: "app-row-body",
        children: [
          createEl("span", { className: "app-row-name", text: entrada.note || (entrada.type === "retirada" ? "Retirada" : "Depósito") }),
          createEl("span", { className: "app-row-note", text: dataCurta(entrada.date) }),
        ],
      }),
      createEl("span", {
        className: `app-row-value${entrada.type === "retirada" ? " is-negative" : ""}`,
        text: `${entrada.type === "retirada" ? "−" : "+"} ${formatarValor(entrada.amount)}`,
      }),
      iconButton("trash", () => {
        removeEntry(entrada.id);
        refresh();
      }, { label: "Apagar lançamento", danger: true }),
    ],
  });
}

function abrirLancamento() {
  const valor = textInput({ placeholder: "Quanto?", type: "number", inputmode: "decimal", step: "0.01" });
  const nota = textInput({ placeholder: "Nota (opcional)" });
  const tipo = chipPicker(
    [
      { id: "deposito", label: "Depositar" },
      { id: "retirada", label: "Retirar" },
    ],
    "deposito"
  );

  showSheet({
    title: "Novo lançamento",
    content: [fieldRow([valor]), nota, tipo.el],
    actions: [
      {
        label: "Registrar",
        primary: true,
        onClick: () => {
          if (!addEntry({ amount: valor.value, type: tipo.value, note: nota.value })) return;
          refresh();
        },
      },
    ],
  });
}
