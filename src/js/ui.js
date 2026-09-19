// Construtores de UI compartilhados. Não conhecem regra de negócio,
// apenas montam DOM a partir de dados simples.

import { createIcon } from "./icons.js";
import { getElement } from "../data/animals.js";

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
  { path: "/lar", label: "Lar", enabled: true },
  { path: "/jardim", label: "Jardim", enabled: true },
  { path: "/santuario", label: "Santuário", enabled: true },
];

export function renderAppShell({ activePath }) {
  const brand = createEl("div", {
    className: "brand",
    children: [
      createEl("span", { className: "brand-name", text: "Pocket Habits" }),
      createEl("span", { className: "brand-tagline", text: "1% melhor a cada dia" }),
    ],
  });

  const settingsLink = createEl("a", {
    className: "link-button",
    text: "Ajustes",
    attrs: { href: "#/ajustes" },
  });

  const header = createEl("header", {
    className: "app-header",
    children: [brand, settingsLink],
  });
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

export function createHabitRow(
  habit,
  { action = null, done = false, onClick = null, companion = null, mood = null } = {}
) {
  const lines = [createEl("span", { className: "habit-name", text: habit.name })];

  if (companion?.animal) {
    lines.push(
      createEl("span", {
        className: "habit-companion",
        text: mood
          ? `${companion.animal.name}, ${mood.label}`
          : `${companion.animal.name}, ${companion.stageLabel.toLowerCase()}`,
      })
    );
  }

  lines.push(
    createEl("span", {
      className: "habit-goal",
      text: done ? "Feito hoje" : `${habit.missions.main} ${habit.unit} hoje`,
    })
  );

  const emblem = companion?.animal
    ? createCreatureBadge({ animal: companion.animal, progress: companion.progress })
    : createEl("div", { className: "habit-icon", children: [createIcon(habit.icon)] });

  const children = [
    emblem,
    createEl("div", { className: "habit-body", children: lines }),
    done ? createEl("span", { className: "habit-done-mark" }) : action,
  ];

  const className = `habit-row${done ? " is-done" : ""}`;
  const style = companion?.animal
    ? `${accentStyle(companion.animal.color)}; --habit-color: ${habit.color}`
    : `--habit-color: ${habit.color}`;

  if (!onClick) {
    return createEl("div", { className, attrs: { style }, children });
  }

  const row = createEl("button", { className, attrs: { style, type: "button" }, children });
  row.addEventListener("click", onClick);
  return row;
}

// Orbe pequeno da criatura, com o anel de progresso do próprio hábito.
export function createCreatureBadge({ animal, progress, locked = false }) {
  return createEl("div", {
    className: `creature-badge${locked ? " is-locked" : ""}`,
    attrs: { style: accentStyle(animal.color) },
    children: [
      locked ? null : createProgressRing(progress),
      createOrb("creature-badge-orb", animal.element),
    ],
  });
}

/*
  A cor do animal vira o accent do contexto. Os tons derivados saem dela por
  color-mix aqui e não no CSS, porque custom properties herdadas não se
  recalculam quando um filho troca a cor base — e o catálogo precisa escalar
  sem uma regra de CSS por animal.
*/
export function accentStyle(color) {
  return [
    `--color-accent: ${color}`,
    `--color-accent-strong: color-mix(in srgb, ${color} 72%, #fff)`,
    `--color-accent-soft: color-mix(in srgb, ${color} 18%, transparent)`,
    `--color-accent-glow: color-mix(in srgb, ${color} 48%, transparent)`,
  ].join("; ");
}

const RING_RADIUS = 78;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Orbe do companheiro com o anel de progresso até o próximo estágio.
export function createCompanion({ animal, stageName, progress, caption }) {
  return createEl("div", {
    className: "companion",
    attrs: { style: accentStyle(animal.color) },
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

// O glifo do orbe vem do elemento definido no catálogo — fonte única.
function createOrb(className, element) {
  return createEl("div", { className, children: [createIcon(getElement(element).icon)] });
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
export function showCelebration({ xpEarned, message, note, evolutionText, animal }, onClose) {
  const overlay = createEl("div", {
    className: "celebration",
    attrs: animal ? { style: accentStyle(animal.color) } : {},
    children: [
      animal ? createOrb("celebration-orb", animal.element) : null,
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

/*
  A criatura entregando um achado. Fecha no toque, e só então o item entra na
  coleção — assim o presente é recebido, não aparece sozinho na lista.
*/
export function showDiscovery(discovery, animal, onCollect) {
  const overlay = createEl("div", {
    className: "celebration",
    attrs: animal ? { style: accentStyle(animal.color) } : {},
    children: [
      createEl("div", { className: "discovery-orb", children: [createIcon(discovery.icon)] }),
      createEl("p", { className: "celebration-message", text: `${animal?.name} encontrou algo.` }),
      createEl("p", { className: "celebration-evolution", text: discovery.name }),
      createEl("p", { className: "celebration-note", text: `"${discovery.story}"` }),
      createEl("p", { className: "mission-xp", text: "Toque para guardar" }),
    ],
  });

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    overlay.remove();
    if (onCollect) onCollect();
  };

  overlay.addEventListener("click", close);
  document.body.appendChild(overlay);
}

export function createSectionHeader(title, action = null) {
  return createEl("div", {
    className: "section-header",
    children: [createEl("h2", { className: "section-title", text: title }), action],
  });
}

/*
  A porta entre Lar e Jardim: os dois lugares são o mesmo terreno, só que
  divididos — um é onde os guardiões vivem, o outro é o que se planta do
  lado. A porta fica colada na borda da cena, com um vislumbre do que tem
  do outro lado, para a travessia parecer visitar o vizinho, não trocar de
  tela. Cada cena põe a sua na borda que faz sentido (Lar → direita,
  Jardim → esquerda), sempre olhando uma para a outra.
*/
export function createScenePortal({ href, label, side, icon }) {
  return createEl("a", {
    className: `scene-portal is-${side}`,
    attrs: { href, "aria-label": `Ir para ${label}` },
    children: [
      createEl("span", { className: "scene-portal-icon", children: icon ? [icon] : [] }),
      createEl("span", { className: "scene-portal-label", text: label }),
      createEl("span", { className: "scene-portal-chevron", attrs: { "aria-hidden": "true" } }),
    ],
  });
}
