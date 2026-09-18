// Construtores de UI compartilhados. Não conhecem regra de negócio,
// apenas montam DOM a partir de dados simples.

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
  { path: "/habitos", label: "Hábitos", enabled: false },
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

const ELEMENT_ICON_PATHS = {
  fogo: "M12 2c1 3-2 4-2 7a4 4 0 1 0 8 0c0-1-.5-2-1-2 .5 2-1 3-2 3-1.5 0-2-1.5-1-3-2 .5-3 2.5-3 4a5 5 0 0 0 10 0C21 7 15 5 12 2Z",
  agua: "M12 2C9 7 5 10.5 5 15a7 7 0 0 0 14 0c0-4.5-4-8-7-13Z",
  terra: "M12 3v6M12 21c-4 0-7-2.5-7-6 2 1 4 1 5-.5C9 12 8 9.5 5 8c3-2 7-1 7 2 0-3 4-4 7-2-3 1.5-4 4-5 6.5 1 1.5 3 1.5 5 .5 0 3.5-3 6-7 6Z",
};

// Ícone elemental minimalista para o emblema (orb) de cada animal.
export function createElementalIcon(element) {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "currentColor");
  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", ELEMENT_ICON_PATHS[element] || ELEMENT_ICON_PATHS.terra);
  svg.appendChild(path);
  return svg;
}
