/*
  Despertador — a tela do app.

  Uma lista de alarmes, cada um com horário, dias e um interruptor. Nada de
  configuração de som ou volume — o que importa aqui é o compromisso com o
  horário, não o efeito sonoro.
*/

import { createEl, showSheet } from "../../ui.js";
import { refresh } from "../../router.js";
import { appShell, appCard, textInput, fieldRow, iconButton, emptyHint, methodCard } from "./kit.js";
import { getAlarms, addAlarm, toggleAlarm, removeAlarm, diasLabel, DIAS } from "../../apps/alarm.js";

const ACCENT = "#f2b84e";

export function renderAlarmApp() {
  const alarmes = getAlarms();
  const suportaNotificacao = typeof Notification !== "undefined";

  return appShell({
    title: "Despertador",
    subtitle: "Horários fixos, sem soneca escondida",
    icon: "bell",
    accent: ACCENT,
    children: [
      appCard({
        title: "Seus alarmes",
        action: iconButton("plus", abrirNovoAlarme, { label: "Novo alarme" }),
        children: [
          createEl("p", {
            className: "card-subtitle",
            text: suportaNotificacao
              ? "Toca por aqui enquanto este app estiver aberto na tela."
              : "Este navegador não avisa por notificação — mantenha a aba aberta perto da hora.",
          }),
          alarmes.length
            ? createEl("div", { className: "app-list", children: alarmes.map(renderAlarme) })
            : emptyHint("Nenhum alarme ainda. Crie um com o + acima."),
        ],
      }),
      methodCard("despertador"),
    ],
  });
}

function renderAlarme(alarme) {
  const interruptor = createEl("button", {
    className: `alarm-toggle${alarme.enabled ? " is-on" : ""}`,
    attrs: { type: "button", "aria-label": alarme.enabled ? "Desligar alarme" : "Ligar alarme" },
    children: [createEl("span", { className: "alarm-toggle-knob" })],
  });
  interruptor.addEventListener("click", () => {
    toggleAlarm(alarme.id);
    refresh();
  });

  return createEl("div", {
    className: `app-row${alarme.enabled ? "" : " is-quiet"}`,
    children: [
      createEl("div", {
        className: "app-row-body",
        children: [
          createEl("span", { className: "app-row-name alarm-time", text: alarme.time }),
          createEl("span", { className: "app-row-note", text: `${alarme.label} · ${diasLabel(alarme.days)}` }),
        ],
      }),
      interruptor,
      iconButton("trash", () => {
        removeAlarm(alarme.id);
        refresh();
      }, { label: "Apagar alarme", danger: true }),
    ],
  });
}

function abrirNovoAlarme() {
  const hora = textInput({ type: "time", value: "07:00" });
  const rotulo = textInput({ placeholder: "Pra quê? (ex.: Correr)" });
  const escolhidos = new Set([0, 1, 2, 3, 4, 5, 6]);

  const chips = createEl("div", {
    className: "quick-picker",
    children: DIAS.map((dia) => {
      const chip = createEl("button", {
        className: "chip is-selected",
        text: dia.label,
        attrs: { type: "button" },
      });
      chip.addEventListener("click", () => {
        if (escolhidos.has(dia.id)) {
          escolhidos.delete(dia.id);
        } else {
          escolhidos.add(dia.id);
        }
        chip.classList.toggle("is-selected", escolhidos.has(dia.id));
      });
      return chip;
    }),
  });

  showSheet({
    title: "Novo alarme",
    subtitle: "Escolha o horário e em quais dias ele repete.",
    content: [fieldRow([hora]), rotulo, chips],
    actions: [
      {
        label: "Criar alarme",
        primary: true,
        onClick: () => {
          if (!escolhidos.size) return;
          addAlarm({ label: rotulo.value, time: hora.value, days: [...escolhidos] });
          refresh();
        },
      },
    ],
  });
}
