/*
  Bullet Journal — a tela do app.

  Um dia por vez, navegável. As três marcas do método (• tarefa, – nota,
  ○ evento) e a migração: tarefa que não foi feita vai para amanhã, e o
  número de vezes que ela migrou fica à vista. Esse contador é o método
  inteiro — depois da terceira, ou não era para agora, ou não era para você.
*/

import { createEl } from "../../ui.js";
import { refresh } from "../../router.js";
import { todayKey } from "../../utils.js";
import {
  appShell,
  statGrid,
  appCard,
  textInput,
  chipPicker,
  primaryButton,
  iconButton,
  emptyHint,
  methodCard,
} from "./kit.js";
import {
  TIPOS,
  getTipo,
  getEntries,
  addEntry,
  toggleDone,
  migrate,
  removeEntry,
  getPendingCount,
  deslocarData,
  rotuloData,
} from "../../apps/journal.js";

const ACCENT = "#9b8cfa";

// O dia aberto é estado de tela, não de dados: recarregar volta para hoje.
let diaAberto = todayKey();

export function renderJournalApp() {
  const entradas = getEntries(diaAberto);
  const tarefas = entradas.filter((entrada) => entrada.type === "tarefa");
  const feitas = tarefas.filter((entrada) => entrada.done).length;

  return appShell({
    title: "Bullet Journal",
    subtitle: "Uma linha por coisa, um dia por página",
    icon: "notebook",
    accent: ACCENT,
    children: [
      statGrid([
        { value: `${feitas}/${tarefas.length}`, label: "tarefas do dia" },
        { value: getPendingCount(todayKey()), label: "abertas hoje" },
        { value: entradas.length, label: "linhas na página" },
      ]),
      renderNavegador(),
      renderEscrever(),
      appCard({
        title: "A página",
        children: entradas.length
          ? [createEl("div", { className: "journal-list", children: entradas.map(renderLinha) })]
          : [emptyHint("Página em branco. Escreva a primeira linha aí em cima.")],
      }),
      methodCard("bullet-journal"),
    ],
  });
}

function renderNavegador() {
  const anterior = iconButton("chevron", () => {
    diaAberto = deslocarData(diaAberto, -1);
    refresh();
  }, { label: "Dia anterior" });
  anterior.classList.add("is-prev");

  const proximo = iconButton("chevron", () => {
    diaAberto = deslocarData(diaAberto, 1);
    refresh();
  }, { label: "Próximo dia" });

  return createEl("div", {
    className: "journal-nav",
    children: [
      anterior,
      createEl("span", { className: "journal-nav-label", text: rotuloData(diaAberto) }),
      proximo,
    ],
  });
}

function renderEscrever() {
  const texto = textInput({ placeholder: "O que entra na página?" });
  const tipo = chipPicker(
    TIPOS.map((item) => ({ id: item.id, label: `${item.marca} ${item.label}` })),
    "tarefa"
  );

  function gravar() {
    if (!addEntry(diaAberto, tipo.value, texto.value)) return;
    texto.value = "";
    refresh();
  }
  texto.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") gravar();
  });

  return appCard({
    title: "Escrever",
    children: [
      texto,
      tipo.el,
      createEl("p", { className: "app-row-note", text: getTipo(tipo.value).nota }),
      primaryButton("Adicionar", gravar, { icon: "plus" }),
    ],
  });
}

function renderLinha(entrada) {
  const tipo = getTipo(entrada.type);
  const ehTarefa = entrada.type === "tarefa";

  const marca = createEl("button", {
    className: `journal-mark${entrada.done ? " is-done" : ""}`,
    text: entrada.done ? "×" : tipo.marca,
    attrs: { type: "button", "aria-label": ehTarefa ? "Concluir" : tipo.label },
  });
  if (ehTarefa) {
    marca.addEventListener("click", () => {
      toggleDone(entrada.id);
      refresh();
    });
  } else {
    marca.disabled = true;
  }

  return createEl("div", {
    className: `journal-line${entrada.done ? " is-done" : ""}`,
    children: [
      marca,
      createEl("div", {
        className: "app-row-body",
        children: [
          createEl("span", { className: "journal-text", text: entrada.text }),
          entrada.migrations
            ? createEl("span", {
                className: "app-row-note",
                text:
                  entrada.migrations >= 3
                    ? `Migrada ${entrada.migrations} vezes — ou não era para agora, ou não era para você.`
                    : `Migrada ${entrada.migrations} ${entrada.migrations === 1 ? "vez" : "vezes"}`,
              })
            : null,
        ],
      }),
      ehTarefa && !entrada.done
        ? iconButton("chevron", () => {
            migrate(entrada.id);
            refresh();
          }, { label: "Migrar para amanhã" })
        : null,
      iconButton("trash", () => {
        removeEntry(entrada.id);
        refresh();
      }, { label: "Apagar linha", danger: true }),
    ],
  });
}
