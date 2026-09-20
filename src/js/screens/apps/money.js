/*
  Radar de Compras — a tela do app.

  Em cima, o mês: quanto saiu, quanto sobrou e como isso se divide entre
  essencial, desejo e guardado, medido contra a regra 50/30/20. Embaixo, a
  lista de espera — o que você quer comprar fica lá por 24 horas antes de
  virar decisão. A ferramenta inteira é essa pausa.
*/

import { createEl, showSheet } from "../../ui.js";
import { refresh } from "../../router.js";
import {
  appShell,
  statGrid,
  appCard,
  textInput,
  fieldRow,
  chipPicker,
  primaryButton,
  iconButton,
  emptyHint,
  methodCard,
  dataCurta,
} from "./kit.js";
import {
  CATEGORIAS,
  getCategoria,
  formatarValor,
  addExpense,
  removeExpense,
  getMonthSummary,
  getIncome,
  setIncome,
  horasDeTrabalho,
  getWishes,
  getDecidedWishes,
  addWish,
  decideWish,
  removeWish,
  horasRestantes,
  podeDecidir,
  totalEvitado,
} from "../../apps/money.js";

const ACCENT = "#6fb8d1";

export function renderMoneyApp() {
  const resumo = getMonthSummary();
  const evitado = totalEvitado();

  return appShell({
    title: "Radar de Compras",
    subtitle: "O mês, e a pausa antes de comprar",
    icon: "wallet",
    accent: ACCENT,
    children: [
      statGrid([
        { value: formatarValor(resumo.total), label: "saiu este mês" },
        resumo.sobrou !== null
          ? { value: formatarValor(resumo.sobrou), label: "sobrou da renda" }
          : { value: resumo.gastos.length, label: "lançamentos" },
        { value: formatarValor(evitado), label: "deixado passar" },
      ]),

      renderRegra(resumo),
      renderLancar(),
      renderEspera(),
      renderGastos(resumo.gastos),
      methodCard("radar-compras"),
    ],
  });
}

/* ------------------------------------------------------------------ */
/* 50/30/20                                                            */
/* ------------------------------------------------------------------ */

/*
  A regra só vira régua quando existe uma renda declarada: sem ela, as
  fatias falam do que já saiu, e não do que devia sair. Por isso a renda
  fica aqui dentro, editável em um toque, e não escondida nos ajustes.
*/
function renderRegra(resumo) {
  const campo = textInput({
    placeholder: "Renda do mês",
    type: "number",
    inputmode: "decimal",
    value: getIncome() ? String(getIncome()) : "",
  });
  campo.addEventListener("change", () => {
    setIncome(campo.value);
    refresh();
  });

  return appCard({
    title: "50 / 30 / 20",
    children: [
      createEl("p", {
        className: "card-subtitle",
        text: resumo.renda
          ? "Metade para o essencial, 30% para o que você quer, 20% guardado."
          : "Informe sua renda do mês para as fatias virarem régua, e não só retrato.",
      }),
      resumo.renda ? null : campo,
      createEl("div", {
        className: "money-rule",
        children: resumo.porCategoria.map((categoria) =>
          createEl("div", {
            className: "money-rule-row",
            children: [
              createEl("div", {
                className: "money-rule-head",
                children: [
                  createEl("span", { className: "money-rule-name", text: categoria.label }),
                  createEl("span", {
                    className: `money-rule-value${categoria.acimaDaMeta ? " is-over" : ""}`,
                    text: `${formatarValor(categoria.valor)} · ${Math.round(categoria.fatia)}%`,
                  }),
                ],
              }),
              createEl("span", {
                className: "money-bar",
                children: [
                  createEl("span", {
                    className: "money-bar-fill",
                    attrs: {
                      style: `width: ${Math.min(100, categoria.fatia)}%; background: ${categoria.cor}`,
                    },
                  }),
                  createEl("span", {
                    className: "money-bar-meta",
                    attrs: { style: `left: ${categoria.meta}%` },
                  }),
                ],
              }),
              createEl("span", {
                className: "app-row-note",
                text: categoria.acimaDaMeta
                  ? `Passou dos ${categoria.meta}% — ${categoria.nota}`
                  : `Meta ${categoria.meta}% · ${categoria.nota}`,
              }),
            ],
          })
        ),
      }),
      resumo.renda
        ? createEl("div", {
            className: "money-income",
            children: [createEl("span", { className: "form-label", text: "Renda do mês" }), campo],
          })
        : null,
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Lançar gasto                                                        */
/* ------------------------------------------------------------------ */

function renderLancar() {
  const valor = textInput({ placeholder: "Quanto?", type: "number", inputmode: "decimal", step: "0.01" });
  const nota = textInput({ placeholder: "No quê? (opcional)" });
  const tipo = chipPicker(
    CATEGORIAS.map((categoria) => ({ id: categoria.id, label: categoria.label })),
    "essencial"
  );

  const aviso = createEl("p", { className: "app-row-note" });
  valor.addEventListener("input", () => {
    const horas = horasDeTrabalho(Number(valor.value));
    aviso.textContent = horas && Number(valor.value) > 0 ? `São ${horas}h do seu trabalho.` : "";
  });

  return appCard({
    title: "Lançar gasto",
    children: [
      fieldRow([valor]),
      nota,
      tipo.el,
      aviso,
      primaryButton("Registrar", () => {
        if (!addExpense({ amount: valor.value, kind: tipo.value, note: nota.value })) return;
        refresh();
      }, { icon: "plus" }),
    ],
  });
}

function renderGastos(gastos) {
  return appCard({
    title: "Este mês",
    children: gastos.length
      ? [
          createEl("div", {
            className: "app-list",
            children: gastos.map((gasto) => {
              const categoria = getCategoria(gasto.kind);
              return createEl("div", {
                className: "app-row",
                children: [
                  createEl("span", {
                    className: "money-dot",
                    attrs: { style: `background: ${categoria.cor}` },
                  }),
                  createEl("div", {
                    className: "app-row-body",
                    children: [
                      createEl("span", { className: "app-row-name", text: gasto.note || categoria.label }),
                      createEl("span", {
                        className: "app-row-note",
                        text: `${categoria.label} · ${dataCurta(gasto.date)}`,
                      }),
                    ],
                  }),
                  createEl("span", { className: "app-row-value", text: formatarValor(gasto.amount) }),
                  iconButton("trash", () => {
                    removeExpense(gasto.id);
                    refresh();
                  }, { label: "Apagar gasto", danger: true }),
                ],
              });
            }),
          }),
        ]
      : [emptyHint("Nada lançado este mês ainda.")],
  });
}

/* ------------------------------------------------------------------ */
/* Regra das 24 horas                                                  */
/* ------------------------------------------------------------------ */

function renderEspera() {
  const desejos = getWishes();
  const decididos = getDecidedWishes().slice(0, 4);

  return appCard({
    title: "Esperando 24h",
    action: iconButton("plus", abrirNovoDesejo, { label: "Novo desejo" }),
    children: [
      createEl("p", {
        className: "card-subtitle",
        text: "Nada de decidir na hora. O que entra aqui só pode ser decidido amanhã.",
      }),
      desejos.length
        ? createEl("div", { className: "app-list", children: desejos.map(renderDesejo) })
        : emptyHint("Nada esperando. Quando bater vontade de comprar algo, ponha aqui primeiro."),
      decididos.length
        ? createEl("div", {
            className: "app-list is-quiet",
            children: decididos.map((desejo) =>
              createEl("div", {
                className: "app-row",
                children: [
                  createEl("div", {
                    className: "app-row-body",
                    children: [
                      createEl("span", { className: "app-row-name", text: desejo.name }),
                      createEl("span", {
                        className: "app-row-note",
                        text: desejo.decision === "comprei" ? "Comprei" : "Deixei passar",
                      }),
                    ],
                  }),
                  createEl("span", { className: "app-row-value", text: formatarValor(desejo.amount) }),
                ],
              })
            ),
          })
        : null,
    ],
  });
}

function renderDesejo(desejo) {
  const horas = horasRestantes(desejo);
  const liberado = podeDecidir(desejo);
  const trabalho = horasDeTrabalho(desejo.amount);

  const acoes = liberado
    ? createEl("div", {
        className: "wish-actions",
        children: [
          (() => {
            const botao = createEl("button", {
              className: "button button-secondary",
              text: "Comprei",
              attrs: { type: "button" },
            });
            botao.addEventListener("click", () => {
              decideWish(desejo.id, "comprei");
              refresh();
            });
            return botao;
          })(),
          (() => {
            const botao = createEl("button", {
              className: "button button-primary",
              text: "Deixei passar",
              attrs: { type: "button" },
            });
            botao.addEventListener("click", () => {
              decideWish(desejo.id, "deixei");
              refresh();
            });
            return botao;
          })(),
        ],
      })
    : createEl("span", {
        className: "wish-clock",
        text: `Pode decidir em ${Math.ceil(horas)}h`,
      });

  return createEl("article", {
    className: `wish-row${liberado ? " is-ready" : ""}`,
    children: [
      createEl("div", {
        className: "app-row",
        children: [
          createEl("div", {
            className: "app-row-body",
            children: [
              createEl("span", { className: "app-row-name", text: desejo.name }),
              createEl("span", {
                className: "app-row-note",
                text: trabalho ? `${trabalho}h do seu trabalho` : "Preciso ou quero?",
              }),
            ],
          }),
          createEl("span", { className: "app-row-value", text: formatarValor(desejo.amount) }),
          iconButton("trash", () => {
            removeWish(desejo.id);
            refresh();
          }, { label: "Tirar da lista", danger: true }),
        ],
      }),
      acoes,
    ],
  });
}

function abrirNovoDesejo() {
  const nome = textInput({ placeholder: "O que você quer comprar?" });
  const valor = textInput({ placeholder: "Quanto custa?", type: "number", inputmode: "decimal" });

  showSheet({
    title: "Esperar 24 horas",
    subtitle: "Escreva agora, decida amanhã. Metade das vontades não sobrevive a uma noite de sono.",
    content: [nome, valor],
    actions: [
      {
        label: "Colocar na espera",
        primary: true,
        onClick: () => {
          if (!addWish({ name: nome.value, amount: valor.value })) return;
          refresh();
        },
      },
    ],
  });
}
