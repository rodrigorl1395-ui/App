/*
  Foco Total — a tela do app.

  Sem sessão ativa: escolher o bloco, escrever a tarefa, começar. Com sessão
  ativa: a tela vira só o cronômetro — cabeçalho e navegação somem (classe
  is-focus-lock no body), e sair exige um toque deliberado em "Encerrar",
  não um deslize sem querer.
*/

import { createEl } from "../../ui.js";
import { refresh } from "../../router.js";
import { appShell, appCard, statGrid, textInput, chipPicker, primaryButton, secondaryButton, methodCard, dataCurta } from "./kit.js";
import {
  BLOCOS,
  getActiveSession,
  startSession,
  registrarDistracao,
  encerrarSessao,
  cancelarSessao,
  getFinishedSessions,
  getTodayMinutes,
  getWeekMinutes,
  getWeekDistractions,
} from "../../apps/focusMode.js";

const ACCENT = "#9b8cfa";

export function renderFocusApp() {
  const sessao = getActiveSession();
  document.body.classList.toggle("is-focus-lock", Boolean(sessao));
  return sessao ? renderTravado(sessao) : renderEscolha();
}

/* ------------------------------------------------------------------ */
/* Escolha do bloco                                                    */
/* ------------------------------------------------------------------ */

function renderEscolha() {
  const historico = getFinishedSessions();
  const tarefa = textInput({ placeholder: "O que você vai fazer neste bloco?" });
  const blocos = chipPicker(
    BLOCOS.map((min) => ({ id: String(min), label: `${min} min` })),
    String(BLOCOS[1])
  );

  return appShell({
    title: "Foco Total",
    subtitle: "Sessões sem distração, contadas de verdade",
    icon: "lock",
    accent: ACCENT,
    children: [
      statGrid([
        { value: `${getTodayMinutes()} min`, label: "hoje" },
        { value: `${getWeekMinutes()} min`, label: "em 7 dias" },
        { value: getWeekDistractions(), label: "saídas em 7 dias" },
      ]),

      appCard({
        title: "Começar um bloco",
        children: [
          tarefa,
          blocos.el,
          primaryButton(
            "Travar e começar",
            () => {
              startSession({ minutes: Number(blocos.value), task: tarefa.value });
              refresh();
            },
            { icon: "lock" }
          ),
        ],
      }),

      historico.length
        ? appCard({
            title: "Histórico",
            children: [
              createEl("div", {
                className: "app-list",
                children: historico.slice(0, 8).map((sessao) =>
                  createEl("div", {
                    className: "app-row",
                    children: [
                      createEl("div", {
                        className: "app-row-body",
                        children: [
                          createEl("span", { className: "app-row-name", text: sessao.task }),
                          createEl("span", {
                            className: "app-row-note",
                            text: `${dataCurta(sessao.date)} · ${sessao.completed ? "completo" : "encerrado antes"}${
                              sessao.interruptions ? ` · ${sessao.interruptions} saída${sessao.interruptions > 1 ? "s" : ""}` : ""
                            }`,
                          }),
                        ],
                      }),
                      createEl("span", { className: "app-row-value", text: `${sessao.minutes} min` }),
                    ],
                  })
                ),
              }),
            ],
          })
        : null,

      methodCard("foco-total"),
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Sessão travada                                                       */
/* ------------------------------------------------------------------ */

function renderTravado(sessao) {
  const totalSegundos = sessao.minutes * 60;

  const relogio = createEl("span", { className: "focus-clock", text: formatarTempo(totalSegundos) });
  const distracoesEl = createEl("span", {
    className: "app-row-note",
    text: legendaDistracoes(sessao.interruptions),
  });

  const wrapper = createEl("div", {
    className: "focus-lock-screen",
    attrs: { style: `--color-accent: ${ACCENT}` },
    children: [
      createEl("span", { className: "focus-lock-label", text: "Em foco" }),
      createEl("h1", { className: "focus-lock-task", text: sessao.task }),
      relogio,
      distracoesEl,
    ],
  });

  const encerrar = secondaryButton("Encerrar antes do fim", () => {
    finalizar(sessao.id, false);
  });
  encerrar.classList.add("focus-lock-exit");
  wrapper.appendChild(encerrar);

  function finalizar(id, completed) {
    limpar();
    if (completed) {
      encerrarSessao(id, { completed: true });
    } else {
      cancelarSessao(id);
    }
    document.body.classList.remove("is-focus-lock");
    refresh();
  }

  const inicio = new Date(sessao.startedAt).getTime();
  const tique = setInterval(() => {
    if (!relogio.isConnected) {
      clearInterval(tique);
      return;
    }
    const restante = totalSegundos - Math.floor((Date.now() - inicio) / 1000);
    if (restante <= 0) {
      relogio.textContent = "0:00";
      finalizar(sessao.id, true);
      return;
    }
    relogio.textContent = formatarTempo(restante);
  }, 1000);

  function aoTrocarVisibilidade() {
    if (document.hidden) {
      registrarDistracao(sessao.id);
      distracoesEl.textContent = legendaDistracoes(sessao.interruptions + 1);
    }
  }

  function limpar() {
    clearInterval(tique);
    document.removeEventListener("visibilitychange", aoTrocarVisibilidade);
  }

  document.addEventListener("visibilitychange", aoTrocarVisibilidade);

  return wrapper;
}

function formatarTempo(segundos) {
  const s = Math.max(0, segundos);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function legendaDistracoes(n) {
  if (!n) return "Nenhuma saída até agora";
  return `${n} ${n === 1 ? "saída" : "saídas"} da aba até agora`;
}
