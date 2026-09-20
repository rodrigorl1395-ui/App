/*
  Academia — a tela do app.

  Dois modos, nunca os dois ao mesmo tempo: com um treino aberto, a tela
  inteira é o treino em andamento (é o que importa quando você está com o
  celular na mão entre uma série e outra); sem treino aberto, é a casa —
  planos, histórico e recordes.

  Durante o treino a tela não se redesenha a cada toque: marcar uma série
  mexe só no botão dela. Um refresh() ali apagaria a carga que a pessoa
  acabou de digitar nos outros exercícios.
*/

import { createEl, showSheet } from "../../ui.js";
import { refresh } from "../../router.js";
import {
  appShell,
  statGrid,
  appCard,
  textInput,
  fieldRow,
  primaryButton,
  secondaryButton,
  iconButton,
  emptyHint,
  methodCard,
  dataCurta,
} from "./kit.js";
import {
  ensureDefaultPlans,
  getPlans,
  getPlan,
  createPlan,
  removePlan,
  addExercise,
  removeExercise,
  getActiveSession,
  startSession,
  toggleSet,
  isSetDone,
  finishSession,
  cancelSession,
  getFinishedSessions,
  getWeekCount,
  sessionVolume,
  getRecords,
  lastWeightOf,
} from "../../apps/gym.js";

const ACCENT = "#e0705f";

export function renderGymApp() {
  ensureDefaultPlans();
  const sessao = getActiveSession();
  return sessao ? renderSessao(sessao) : renderCasa();
}

/* ------------------------------------------------------------------ */
/* Casa                                                                */
/* ------------------------------------------------------------------ */

function renderCasa() {
  const planos = getPlans();
  const feitos = getFinishedSessions();
  const recordes = getRecords();

  return appShell({
    title: "Academia",
    subtitle: "Treinos, séries e carga",
    icon: "dumbbell",
    accent: ACCENT,
    children: [
      statGrid([
        { value: getWeekCount(), label: "treinos em 7 dias" },
        { value: feitos.length, label: "treinos no total" },
        { value: recordes.length ? `${recordes[0].weight}kg` : "—", label: "maior carga" },
      ]),

      appCard({
        title: "Seus treinos",
        action: iconButton("plus", abrirNovoPlano, { label: "Novo treino" }),
        children: planos.length
          ? planos.map(renderPlano)
          : [emptyHint("Nenhum treino montado. Crie um com o + acima.")],
      }),

      feitos.length
        ? appCard({
            title: "Histórico",
            children: [
              createEl("div", {
                className: "app-list",
                children: feitos.slice(0, 8).map(renderLinhaHistorico),
              }),
            ],
          })
        : null,

      recordes.length
        ? appCard({
            title: "Recordes",
            children: [
              createEl("div", {
                className: "app-list",
                children: recordes.slice(0, 6).map((recorde) =>
                  createEl("div", {
                    className: "app-row",
                    children: [
                      createEl("div", {
                        className: "app-row-body",
                        children: [
                          createEl("span", { className: "app-row-name", text: recorde.name }),
                          createEl("span", {
                            className: "app-row-note",
                            text: `${recorde.reps} reps · ${dataCurta(recorde.date)}`,
                          }),
                        ],
                      }),
                      createEl("span", { className: "app-row-value", text: `${recorde.weight} kg` }),
                    ],
                  })
                ),
              }),
            ],
          })
        : null,

      methodCard("coach-academia"),
    ],
  });
}

/*
  O cartão do treino: tocar no nome abre a edição, o botão ao lado começa.
  São as duas únicas coisas que se faz com um plano.
*/
function renderPlano(plano) {
  const cabeca = createEl("button", {
    className: "workout-plan-head",
    attrs: { type: "button" },
    children: [
      createEl("div", {
        className: "app-row-body",
        children: [
          createEl("span", { className: "app-row-name", text: plano.name }),
          createEl("span", {
            className: "app-row-note",
            text: plano.exercises.length
              ? plano.exercises.map((ex) => ex.name).join(" · ")
              : "Sem exercícios ainda",
          }),
        ],
      }),
    ],
  });
  cabeca.addEventListener("click", () => abrirPlano(plano.id));

  const comecar = primaryButton(
    "Começar",
    () => {
      startSession(plano.id);
      refresh();
    },
    { block: false }
  );
  comecar.disabled = !plano.exercises.length;

  return createEl("article", { className: "workout-plan", children: [cabeca, comecar] });
}

function abrirPlano(planId) {
  const plano = getPlan(planId);
  if (!plano) return;

  const nome = textInput({ placeholder: "Exercício" });
  const series = textInput({ placeholder: "Séries", type: "number", inputmode: "numeric" });
  const reps = textInput({ placeholder: "Reps", type: "number", inputmode: "numeric" });

  showSheet({
    title: plano.name,
    subtitle: "Os exercícios deste treino.",
    content: [
      createEl("div", {
        className: "app-list",
        children: plano.exercises.length
          ? plano.exercises.map((ex) =>
              createEl("div", {
                className: "app-row",
                children: [
                  createEl("div", {
                    className: "app-row-body",
                    children: [
                      createEl("span", { className: "app-row-name", text: ex.name }),
                      createEl("span", { className: "app-row-note", text: `${ex.sets} × ${ex.reps}` }),
                    ],
                  }),
                  iconButton(
                    "trash",
                    () => {
                      removeExercise(plano.id, ex.id);
                      document.querySelector(".sheet-overlay")?.remove();
                      abrirPlano(plano.id);
                    },
                    { label: "Remover exercício", danger: true }
                  ),
                ],
              })
            )
          : [emptyHint("Nenhum exercício. Adicione o primeiro abaixo.")],
      }),
      fieldRow([nome]),
      fieldRow([series, reps]),
    ],
    actions: [
      {
        label: "Adicionar exercício",
        primary: true,
        keepOpen: true,
        onClick: () => {
          if (!nome.value.trim()) return;
          addExercise(plano.id, {
            name: nome.value.trim(),
            sets: Number(series.value) || 3,
            reps: Number(reps.value) || 10,
          });
          document.querySelector(".sheet-overlay")?.remove();
          abrirPlano(plano.id);
          refresh();
        },
      },
      {
        label: "Apagar este treino",
        onClick: () => {
          removePlan(plano.id);
          refresh();
        },
      },
    ],
  });
}

function abrirNovoPlano() {
  const nome = textInput({ placeholder: "Nome do treino (ex.: D · Costas)" });
  showSheet({
    title: "Novo treino",
    subtitle: "Depois é só adicionar os exercícios dentro dele.",
    content: [nome],
    actions: [
      {
        label: "Criar",
        primary: true,
        onClick: () => {
          if (!nome.value.trim()) return;
          createPlan(nome.value.trim());
          refresh();
        },
      },
    ],
  });
}

function renderLinhaHistorico(sessao) {
  const volume = sessionVolume(sessao);
  return createEl("div", {
    className: "app-row",
    children: [
      createEl("div", {
        className: "app-row-body",
        children: [
          createEl("span", { className: "app-row-name", text: sessao.planName }),
          createEl("span", {
            className: "app-row-note",
            text: `${dataCurta(sessao.date)} · ${sessao.sets.length} ${
              sessao.sets.length === 1 ? "série" : "séries"
            }`,
          }),
        ],
      }),
      createEl("span", {
        className: "app-row-value",
        text: volume ? `${Math.round(volume)} kg` : "—",
      }),
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Treino em andamento                                                 */
/* ------------------------------------------------------------------ */

function renderSessao(sessao) {
  const plano = getPlan(sessao.planId);
  const exercicios = plano?.exercises || [];
  const totalSeries = exercicios.reduce((soma, ex) => soma + ex.sets, 0);

  const contador = createEl("span", {
    className: "app-stat-value",
    text: `${sessao.sets.length}/${totalSeries}`,
  });

  // O relógio anda sozinho; o resto da tela fica quieto.
  const relogio = createEl("span", { className: "app-stat-value", text: "0:00" });
  const tique = setInterval(() => {
    if (!relogio.isConnected) {
      clearInterval(tique);
      return;
    }
    const segundos = Math.floor((Date.now() - new Date(sessao.startedAt).getTime()) / 1000);
    relogio.textContent = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;
  }, 1000);

  return appShell({
    title: sessao.planName,
    subtitle: "Treino em andamento",
    icon: "dumbbell",
    accent: ACCENT,
    children: [
      createEl("div", {
        className: "app-stats",
        children: [
          createEl("div", {
            className: "app-stat",
            children: [relogio, createEl("span", { className: "app-stat-label", text: "tempo" })],
          }),
          createEl("div", {
            className: "app-stat",
            children: [contador, createEl("span", { className: "app-stat-label", text: "séries feitas" })],
          }),
        ],
      }),

      ...exercicios.map((ex) => renderExercicio(sessao, ex, contador, totalSeries)),

      exercicios.length ? null : emptyHint("Este treino não tem exercícios. Volte e adicione alguns."),

      primaryButton("Encerrar treino", () => {
        finishSession(sessao.id);
        clearInterval(tique);
        refresh();
      }, { icon: "check" }),

      secondaryButton("Cancelar treino", () => {
        cancelSession(sessao.id);
        clearInterval(tique);
        refresh();
      }, { danger: true }),
    ],
  });
}

/*
  Um exercício em andamento: a carga fica num campo só, no topo (é a mesma
  em todas as séries na prática), e cada série é um botão que marca e
  desmarca. Dois toques por série seria um a mais do que a academia permite
  com a mão suada.
*/
function renderExercicio(sessao, exercicio, contador, totalSeries) {
  const sugestao = lastWeightOf(exercicio.name);
  const carga = textInput({
    placeholder: "kg",
    type: "number",
    inputmode: "decimal",
    step: "0.5",
    value: sugestao ? String(sugestao) : "",
  });
  const reps = textInput({
    placeholder: "reps",
    type: "number",
    inputmode: "numeric",
    value: String(exercicio.reps),
  });

  const botoes = [];
  for (let i = 0; i < exercicio.sets; i += 1) {
    const feito = isSetDone(sessao, exercicio.id, i);
    const botao = createEl("button", {
      className: `set-chip${feito ? " is-done" : ""}`,
      text: String(i + 1),
      attrs: { type: "button", "aria-label": `Série ${i + 1}` },
    });
    botao.addEventListener("click", () => {
      toggleSet(sessao.id, exercicio, i, { reps: reps.value, weight: carga.value });
      const agora = getActiveSession();
      botao.classList.toggle("is-done", isSetDone(agora, exercicio.id, i));
      contador.textContent = `${agora.sets.length}/${totalSeries}`;
    });
    botoes.push(botao);
  }

  return createEl("section", {
    className: "card exercise-card",
    children: [
      createEl("div", {
        className: "exercise-head",
        children: [
          createEl("span", { className: "app-row-name", text: exercicio.name }),
          createEl("span", { className: "app-row-note", text: `${exercicio.sets} × ${exercicio.reps}` }),
        ],
      }),
      fieldRow([carga, reps]),
      createEl("div", { className: "set-row", children: botoes }),
      sugestao
        ? createEl("span", { className: "app-row-note", text: `Última carga: ${sugestao} kg` })
        : null,
    ],
  });
}
