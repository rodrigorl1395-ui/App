/*
  Peças compartilhadas dos apps das ferramentas.

  Os quatro apps (academia, dinheiro, diário, leitura) são coisas bem
  diferentes, mas a casca é a mesma: cabeçalho com ícone e volta, uma faixa
  de números, formulários curtos e listas. Repetir isso quatro vezes seria
  quatro jeitos diferentes de fazer a mesma coisa — e é assim que um app
  começa a parecer remendado.
*/

import { createEl } from "../../ui.js";
import { createIcon } from "../../icons.js";
import { getToolItem } from "../../../data/tools.js";
import { isObtained } from "../../tools.js";

export function appShell({ title, subtitle, icon, accent, children = [] }) {
  return createEl("div", {
    className: "screen app-screen",
    attrs: accent ? { style: `--color-app: ${accent}` } : {},
    children: [
      createEl("div", {
        className: "app-topbar",
        children: [
          createEl("a", {
            className: "app-back",
            attrs: { href: "#/ferramentas", "aria-label": "Voltar para os apps" },
            children: [createEl("span", { className: "app-back-arrow", attrs: { "aria-hidden": "true" } })],
          }),
          createEl("span", { className: "app-topbar-icon", children: [createIcon(icon)] }),
          createEl("div", {
            className: "app-topbar-body",
            children: [
              createEl("h1", { className: "app-topbar-title", text: title }),
              subtitle ? createEl("span", { className: "app-topbar-subtitle", text: subtitle }) : null,
            ],
          }),
        ],
      }),
      ...children,
    ],
  });
}

// Faixa de números do topo: o resumo que responde "como estou indo nisso?"
// antes de qualquer lista.
export function statGrid(items) {
  return createEl("div", {
    className: "app-stats",
    children: items.filter(Boolean).map((item) =>
      createEl("div", {
        className: "app-stat",
        children: [
          createEl("span", { className: "app-stat-value", text: String(item.value) }),
          createEl("span", { className: "app-stat-label", text: item.label }),
        ],
      })
    ),
  });
}

export function appCard({ title, action = null, children = [] }) {
  return createEl("section", {
    className: "card app-card",
    children: [
      title
        ? createEl("div", {
            className: "app-card-head",
            children: [createEl("h2", { className: "card-title", text: title }), action],
          })
        : null,
      ...children,
    ],
  });
}

export function textInput({ placeholder, type = "text", value = "", inputmode, step } = {}) {
  const attrs = { type, placeholder: placeholder || "" };
  if (inputmode) attrs.inputmode = inputmode;
  if (step) attrs.step = step;
  const input = createEl("input", { className: "input", attrs });
  input.value = value;
  return input;
}

export function fieldRow(children) {
  return createEl("div", { className: "app-field-row", children });
}

export function label(text) {
  return createEl("span", { className: "form-label", text });
}

/*
  Seletor em chips. Devolve o elemento e uma função para ler o escolhido —
  a tela não precisa guardar estado de seleção em lugar nenhum.
*/
export function chipPicker(options, selectedId, onSelect) {
  let atual = selectedId;
  const chips = new Map();

  const row = createEl("div", {
    className: "quick-picker",
    children: options.map((option) => {
      const chip = createEl("button", {
        className: `chip${option.id === atual ? " is-selected" : ""}`,
        text: option.label,
        attrs: { type: "button" },
      });
      chip.addEventListener("click", () => {
        atual = option.id;
        chips.forEach((el, id) => el.classList.toggle("is-selected", id === atual));
        onSelect?.(atual);
      });
      chips.set(option.id, chip);
      return chip;
    }),
  });

  return { el: row, get value() { return atual; } };
}

export function primaryButton(text, onClick, { icon, block = true } = {}) {
  const button = createEl("button", {
    className: `button button-primary${block ? " button-block" : ""}`,
    attrs: { type: "button" },
    children: [
      icon ? createEl("span", { className: "button-icon", children: [createIcon(icon)] }) : null,
      createEl("span", { text }),
    ],
  });
  button.addEventListener("click", onClick);
  return button;
}

export function secondaryButton(text, onClick, { danger = false } = {}) {
  const button = createEl("button", {
    className: `button button-secondary${danger ? " link-danger" : ""}`,
    text,
    attrs: { type: "button" },
  });
  button.addEventListener("click", onClick);
  return button;
}

export function iconButton(icon, onClick, { label: rotulo, danger = false } = {}) {
  const button = createEl("button", {
    className: `app-icon-button${danger ? " is-danger" : ""}`,
    attrs: { type: "button", "aria-label": rotulo || icon },
    children: [createIcon(icon)],
  });
  button.addEventListener("click", onClick);
  return button;
}

export function emptyHint(text) {
  return createEl("p", { className: "app-empty", text });
}

export function progressBar(ratio, { color } = {}) {
  return createEl("span", {
    className: "app-progress",
    children: [
      createEl("span", {
        className: "app-progress-fill",
        attrs: {
          style: `width: ${Math.max(2, Math.min(100, ratio * 100))}%${color ? `; background: ${color}` : ""}`,
        },
      }),
    ],
  });
}

// Data curta para listas: "12 de março", ou "hoje" quando for hoje.
export function dataCurta(dateKey) {
  const hoje = new Date().toISOString().slice(0, 10);
  if (dateKey === hoje) return "hoje";
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" }).format(
    new Date(`${dateKey}T00:00:00`)
  );
}

/*
  A ficha do método, no rodapé do app a que ela pertence. O texto que a
  ferramenta entrega (o bullet journal em três marcas, o 50/30/20, o plano
  de quatro semanas) só é útil perto de onde se usa — numa lista de
  "conteúdos" ele vira enfeite que ninguém abre duas vezes.
*/
export function methodCard(toolId) {
  const tool = getToolItem(toolId);
  if (!tool?.content) return null;

  const corpo = createEl("div", {
    className: "method-body",
    children: [
      createEl("p", { className: "card-subtitle", text: tool.content.intro }),
      ...tool.content.items.map((item) =>
        createEl("div", {
          className: "method-item",
          children: [
            createEl("span", { className: "method-item-title", text: item.titulo }),
            createEl("span", { className: "method-item-text", text: item.texto }),
          ],
        })
      ),
    ],
  });
  corpo.hidden = true;

  const botao = createEl("button", {
    className: "method-toggle",
    attrs: { type: "button" },
    children: [
      createEl("span", { text: "Como usar" }),
      createEl("span", { className: "method-chevron", attrs: { "aria-hidden": "true" } }),
    ],
  });
  botao.addEventListener("click", () => {
    corpo.hidden = !corpo.hidden;
    botao.classList.toggle("is-open", !corpo.hidden);
  });

  return createEl("section", { className: "card method-card", children: [botao, corpo] });
}

/*
  Um app só existe depois que a ferramenta foi obtida. Sem isto, bastaria
  digitar a rota para usar o que ainda não foi conquistado — e o que
  destrava um app é o histórico, não o endereço.
*/
export function guardApp(toolId, render) {
  return () => {
    if (!isObtained(toolId)) {
      const tool = getToolItem(toolId);
      return createEl("div", {
        className: "screen app-screen",
        children: [
          createEl("div", {
            className: "app-topbar",
            children: [
              createEl("a", {
                className: "app-back",
                attrs: { href: "#/ferramentas", "aria-label": "Voltar" },
                children: [createEl("span", { className: "app-back-arrow", attrs: { "aria-hidden": "true" } })],
              }),
              createEl("div", {
                className: "app-topbar-body",
                children: [createEl("h1", { className: "app-topbar-title", text: tool?.name || "Ferramenta" })],
              }),
            ],
          }),
          createEl("p", {
            className: "app-empty",
            text: "Esta ferramenta ainda não é sua. Ela aparece em Apps quando for obtida.",
          }),
        ],
      });
    }
    return render();
  };
}
