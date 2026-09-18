// Construtores de UI compartilhados. Não conhecem regra de negócio,
// apenas montam DOM a partir de dados simples.

import { createIcon, createElementalIcon } from "./icons.js";

export function createEl(tag, { className, text, attrs = {}, children = [] } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  for (const child of children) {
    if (child) el.appendChild(child);
  }
  return el;
}

const NAV_ITEMS = [
  { path: "/hoje", label: "Hoje", enabled: true },
  { path: "/habitos", label: "Hábitos", enabled: true },
  { path: "/jardim", label: "Jardim", enabled: false },
  { path: "/animal", label: "Animal", enabled: false },
];

export function renderAppShell({ activePath }) {
  const brand = createEl("div", {
    className: "brand",
    children: [
      createEl("span", { className: "brand-name", text: "Pocket Habits" }),
      createEl("span", { className: "brand-tagline", text: "1% melhor a cada dia" }),
    ],
  });

  const header = createEl("header", { className: "app-header", children: [brand] });
  const main = createEl("main", { className: "app-main", attrs: { id: "app-main" } });

  const navItems = NAV_ITEMS.map((item) => {
    if (!item.enabled) {
      return createEl("span", {
        className: "nav-item is-disabled",
        attrs: { "aria-disabled": "true", title: "Em breve" },
        children: [
          createEl("span", { className: "nav-item-icon" }),
          createEl("span", { text: item.label }),
        ],
      });
    }
    return createEl("a", {
      className: `nav-item${item.path === activePath ? " is-active" : ""}`,
      attrs: { href: `#${item.path}`, "data-nav-link": "" },
      children: [
        createEl("span", { className: "nav-item-icon" }),
        createEl("span", { text: item.label }),
      ],
    });
  });

  const nav = createEl("nav", { className: "app-nav", children: navItems });

  const root = createEl("div", { className: "app-shell", children: [header, main, nav] });

  return { root, main };
}

export function createCard({ title, subtitle, accent = false, children = [] } = {}) {
  const nodes = [];
  if (title) nodes.push(createEl("h2", { className: "card-title", text: title }));
  if (subtitle) nodes.push(createEl("p", { className: "card-subtitle", text: subtitle }));
  return createEl("section", {
    className: `card${accent ? " card-accent" : ""}`,
    children: [...nodes, ...children],
  });
}

export function createEmptyState(message) {
  return createEl("div", { className: "empty-state", children: [createEl("p", { text: message })] });
}

export function createHabitRow(habit, { action = null, done = false, onClick = null } = {}) {
  const body = createEl("div", {
    className: "habit-body",
    children: [
      createEl("span", { className: "habit-name", text: habit.name }),
      createEl("span", {
        className: "habit-goal",
        text: done ? "Feito hoje" : `${habit.missions.main} ${habit.unit} hoje`,
      }),
    ],
  });

  const children = [
    createEl("div", { className: "habit-icon", children: [createIcon(habit.icon)] }),
    body,
    done ? createEl("span", { className: "habit-done-mark" }) : action,
  ];

  const className = `habit-row${done ? " is-done" : ""}`;
  const style = `--habit-color: ${habit.color}`;

  if (!onClick) {
    return createEl("div", { className, attrs: { style }, children });
  }

  const row = createEl("button", { className, attrs: { style, type: "button" }, children });
  row.addEventListener("click", onClick);
  return row;
}

const RING_RADIUS = 78;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Orbe do companheiro com o anel de progresso até o próximo estágio.
export function createCompanion({ animal, stageName, progress, caption }) {
  return createEl("div", {
    className: "companion",
    children: [
      createEl("div", {
        className: "companion-ring",
        children: [createProgressRing(progress), createOrb("companion-orb", animal.element)],
      }),
      createEl("p", { className: "companion-name", text: animal.name }),
      createEl("p", { className: "companion-stage", text: stageName }),
      createEl("p", { className: "companion-progress", text: caption }),
    ],
  });
}

function createOrb(className, element) {
  return createEl("div", { className, children: [createElementalIcon(element)] });
}

function createProgressRing(progress) {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 168 168");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", "companion-ring-svg");

  for (const className of ["companion-ring-track", "companion-ring-progress"]) {
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", "84");
    circle.setAttribute("cy", "84");
    circle.setAttribute("r", String(RING_RADIUS));
    circle.setAttribute("class", className);
    if (className === "companion-ring-progress") {
      circle.setAttribute("stroke-dasharray", String(RING_CIRCUMFERENCE));
      circle.setAttribute("stroke-dashoffset", String(RING_CIRCUMFERENCE * (1 - progress)));
    }
    svg.appendChild(circle);
  }

  return svg;
}

/*
  Overlay de comemoração. Quando há evolução, o companheiro aparece e "acorda"
  — é o momento dele. Fecha no toque ou sozinho, e chama onClose.
*/
export function showCelebration({ xpEarned, message, note, evolutionText, element }, onClose) {
  const overlay = createEl("div", {
    className: "celebration",
    children: [
      evolutionText && element ? createOrb("celebration-orb", element) : null,
      createEl("p", { className: "celebration-xp", text: `+${xpEarned} XP` }),
      createEl("p", { className: "celebration-message", text: message }),
      evolutionText ? createEl("p", { className: "celebration-evolution", text: evolutionText }) : null,
      note ? createEl("p", { className: "celebration-note", text: note }) : null,
    ],
  });

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    overlay.remove();
    if (onClose) onClose();
  };

  overlay.addEventListener("click", close);
  setTimeout(close, evolutionText ? 3600 : 2200);
  document.body.appendChild(overlay);
}

export function createSectionHeader(title, action = null) {
  return createEl("div", {
    className: "section-header",
    children: [createEl("h2", { className: "section-title", text: title }), action],
  });
}
