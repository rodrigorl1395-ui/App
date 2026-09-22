/*
  Agenda — a tela do app.

  Uma lista do que vem antes, outra do que já passou — separadas porque a
  pergunta de quem abre a agenda é "o que vem por aí?", não "o que eu já
  fiz". Cada linha mostra data, hora (se houver) e o atraso quando existe.
*/

import { createEl, showSheet } from "../../ui.js";
import { refresh } from "../../router.js";
import { appShell, appCard, statGrid, textInput, fieldRow, iconButton, emptyHint, methodCard, dataCurta } from "./kit.js";
import { getUpcoming, getPast, addEvent, toggleEvent, removeEvent, isAtrasado } from "../../apps/agenda.js";

const ACCENT = "#6db3f2";

export function renderAgendaApp() {
  const proximos = getUpcoming();
  const passados = getPast().slice(0, 8);
  const atrasados = proximos.filter(isAtrasado).length;

  return appShell({
    title: "Agenda",
    subtitle: "O que tem hora marcada",
    icon: "calendar",
    accent: ACCENT,
    children: [
      statGrid([
        { value: proximos.length, label: "por vir" },
        { value: atrasados, label: "atrasados" },
        { value: passados.filter((e) => e.done).length, label: "concluídos" },
      ]),

      appCard({
        title: "Próximos",
        action: iconButton("plus", abrirNovoEvento, { label: "Novo compromisso" }),
        children: proximos.length
          ? [createEl("div", { className: "app-list", children: proximos.map(renderEvento) })]
          : [emptyHint("Nada marcado. Adicione um compromisso com o + acima.")],
      }),

      passados.length
        ? appCard({
            title: "Já passou",
            children: [createEl("div", { className: "app-list is-quiet", children: passados.map(renderEvento) })],
          })
        : null,

      methodCard("agenda"),
    ],
  });
}

function renderEvento(evento) {
  const atrasado = isAtrasado(evento);
  const marcar = iconButton("check", () => {
    toggleEvent(evento.id);
    refresh();
  }, { label: evento.done ? "Desmarcar" : "Marcar como feito" });

  return createEl("div", {
    className: `app-row${evento.done ? " is-quiet" : ""}${atrasado ? " is-late" : ""}`,
    children: [
      marcar,
      createEl("div", {
        className: "app-row-body",
        children: [
          createEl("span", { className: "app-row-name", text: evento.title }),
          createEl("span", {
            className: "app-row-note",
            text: `${dataCurta(evento.date)}${evento.time ? ` · ${evento.time}` : ""}${atrasado ? " · atrasado" : ""}`,
          }),
        ],
      }),
      iconButton("trash", () => {
        removeEvent(evento.id);
        refresh();
      }, { label: "Apagar compromisso", danger: true }),
    ],
  });
}

function abrirNovoEvento() {
  const titulo = textInput({ placeholder: "O quê?" });
  const data = textInput({ type: "date", value: new Date().toISOString().slice(0, 10) });
  const hora = textInput({ type: "time" });
  const notas = textInput({ placeholder: "Notas (opcional)" });

  showSheet({
    title: "Novo compromisso",
    subtitle: "Data e hora marcada — o que ainda não tem hora é hábito, não agenda.",
    content: [titulo, fieldRow([data, hora]), notas],
    actions: [
      {
        label: "Adicionar",
        primary: true,
        onClick: () => {
          if (!addEvent({ title: titulo.value, date: data.value, time: hora.value, notes: notas.value })) return;
          refresh();
        },
      },
    ],
  });
}
