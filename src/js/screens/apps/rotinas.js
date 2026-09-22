/*
  Rotinas — a tela do app.

  Dois modos, nunca os dois ao mesmo tempo: com uma execução aberta, a tela
  inteira é a sequência em andamento; sem nenhuma, é a casa — as rotinas e o
  histórico. Marcar um passo mexe só no botão dele, como no treino.
*/

import { createEl, showSheet } from "../../ui.js";
import { refresh } from "../../router.js";
import {
  appShell,
  appCard,
  statGrid,
  textInput,
  primaryButton,
  secondaryButton,
  iconButton,
  emptyHint,
  methodCard,
  progressBar,
  dataCurta,
} from "./kit.js";
import {
  getRoutines,
  getRoutine,
  createRoutine,
  removeRoutine,
  addStep,
  removeStep,
  getActiveRun,
  startRun,
  toggleStep,
  finishRun,
  cancelRun,
  getExecucoes,
  getSemana,
  getMaisUsada,
  getSequencia,
} from "../../apps/rotinas.js";

const ACCENT = "#7d9b6a";

export function renderRotinasApp() {
  const aberta = getActiveRun();
  return aberta ? renderExecucao(aberta.rotina, aberta.execucao) : renderCasa();
}

/* ------------------------------------------------------------------ */
/* Casa                                                                */
/* ------------------------------------------------------------------ */

function renderCasa() {
  const rotinas = getRoutines();
  const historico = getExecucoes().slice(0, 8);
  const campea = getMaisUsada();
  const sequencia = getSequencia();

  return appShell({
    title: "Rotinas",
    subtitle: "Sequências que você repete",
    icon: "list",
    accent: ACCENT,
    children: [
      statGrid([
        { value: getSemana(), label: "execuções em 7 dias" },
        { value: campea ? campea.name : "—", label: "mais usada" },
        { value: sequencia, label: sequencia === 1 ? "dia seguido" : "dias seguidos" },
      ]),

      appCard({
        title: "Suas rotinas",
        action: iconButton("plus", abrirNovaRotina, { label: "Nova rotina" }),
        children: rotinas.length
          ? rotinas.map(renderRotina)
          : [emptyHint("Nenhuma rotina ainda. Crie a primeira com o + acima.")],
      }),

      historico.length
        ? appCard({
            title: "Histórico",
            children: [
              createEl("div", {
                className: "app-list",
                children: historico.map((execucao) =>
                  createEl("div", {
                    className: "app-row",
                    children: [
                      createEl("div", {
                        className: "app-row-body",
                        children: [
                          createEl("span", { className: "app-row-name", text: execucao.routineName }),
                          createEl("span", {
                            className: "app-row-note",
                            text: `${dataCurta(execucao.date)} · ${execucao.done.length} ${
                              execucao.done.length === 1 ? "passo" : "passos"
                            }`,
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

      methodCard("rotinas"),
    ],
  });
}

function renderRotina(rotina) {
  const cabeca = createEl("button", {
    className: "workout-plan-head",
    attrs: { type: "button" },
    children: [
      createEl("div", {
        className: "app-row-body",
        children: [
          createEl("span", { className: "app-row-name", text: rotina.name }),
          createEl("span", {
            className: "app-row-note",
            text: rotina.steps.length ? rotina.steps.map((passo) => passo.text).join(" · ") : "Sem passos ainda",
          }),
        ],
      }),
    ],
  });
  cabeca.addEventListener("click", () => abrirRotina(rotina.id));

  const comecar = primaryButton(
    "Executar",
    () => {
      startRun(rotina.id);
      refresh();
    },
    { block: false }
  );
  comecar.disabled = !rotina.steps.length;

  return createEl("article", { className: "workout-plan", children: [cabeca, comecar] });
}

function abrirRotina(routineId) {
  const rotina = getRoutine(routineId);
  if (!rotina) return;

  const passo = textInput({ placeholder: "Próximo passo" });

  showSheet({
    title: rotina.name,
    subtitle: "Os passos, na ordem em que você faz.",
    content: [
      createEl("div", {
        className: "app-list",
        children: rotina.steps.length
          ? rotina.steps.map((item, indice) =>
              createEl("div", {
                className: "app-row",
                children: [
                  createEl("div", {
                    className: "app-row-body",
                    children: [
                      createEl("span", { className: "app-row-name", text: `${indice + 1}. ${item.text}` }),
                    ],
                  }),
                  iconButton(
                    "trash",
                    () => {
                      removeStep(rotina.id, item.id);
                      document.querySelector(".sheet-overlay")?.remove();
                      abrirRotina(rotina.id);
                      refresh();
                    },
                    { label: "Remover passo", danger: true }
                  ),
                ],
              })
            )
          : [emptyHint("Nenhum passo. Adicione o primeiro abaixo.")],
      }),
      passo,
    ],
    actions: [
      {
        label: "Adicionar passo",
        primary: true,
        keepOpen: true,
        onClick: () => {
          if (!passo.value.trim()) return;
          addStep(rotina.id, passo.value);
          document.querySelector(".sheet-overlay")?.remove();
          abrirRotina(rotina.id);
          refresh();
        },
      },
      {
        label: "Apagar esta rotina",
        onClick: () => {
          removeRoutine(rotina.id);
          refresh();
        },
      },
    ],
  });
}

function abrirNovaRotina() {
  const nome = textInput({ placeholder: "Nome da rotina (ex.: Fechar o dia)" });
  showSheet({
    title: "Nova rotina",
    subtitle: "Comece com dois ou três passos. Dá pra crescer depois.",
    content: [nome],
    actions: [
      {
        label: "Criar",
        primary: true,
        onClick: () => {
          if (!createRoutine(nome.value)) return;
          refresh();
        },
      },
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Execução em andamento                                               */
/* ------------------------------------------------------------------ */

function renderExecucao(rotina, execucao) {
  const total = rotina.steps.length;
  const barra = progressBar(execucao.done.length / total, { color: ACCENT });
  const contador = createEl("span", {
    className: "app-stat-value",
    text: `${execucao.done.length}/${total}`,
  });

  const concluir = primaryButton("Concluir rotina", () => {
    finishRun(rotina.id, execucao.id);
    refresh();
  }, { icon: "check" });

  const atualizar = () => {
    const atual = getActiveRun()?.execucao;
    if (!atual) return;
    contador.textContent = `${atual.done.length}/${total}`;
    barra.firstChild.setAttribute(
      "style",
      `width: ${Math.max(2, (atual.done.length / total) * 100)}%; background: ${ACCENT}`
    );
    concluir.disabled = atual.done.length < total;
  };

  const passos = rotina.steps.map((passo, indice) => {
    const linha = createEl("button", {
      className: `quest-step${execucao.done.includes(passo.id) ? " is-done" : ""}`,
      attrs: { type: "button" },
      children: [
        createEl("span", { className: "quest-step-mark", attrs: { "aria-hidden": "true" } }),
        createEl("span", { className: "app-row-name", text: `${indice + 1}. ${passo.text}` }),
      ],
    });
    linha.addEventListener("click", () => {
      toggleStep(rotina.id, execucao.id, passo.id);
      linha.classList.toggle("is-done", getActiveRun()?.execucao.done.includes(passo.id));
      atualizar();
    });
    return linha;
  });

  concluir.disabled = execucao.done.length < total;

  return appShell({
    title: rotina.name,
    subtitle: "Rotina em andamento",
    icon: "list",
    accent: ACCENT,
    children: [
      createEl("div", {
        className: "app-stats",
        children: [
          createEl("div", {
            className: "app-stat",
            children: [contador, createEl("span", { className: "app-stat-label", text: "passos feitos" })],
          }),
        ],
      }),
      barra,
      appCard({ title: "Na ordem", children: [createEl("div", { className: "app-list", children: passos })] }),
      concluir,
      secondaryButton("Cancelar execução", () => {
        cancelRun(rotina.id, execucao.id);
        refresh();
      }, { danger: true }),
    ],
  });
}
