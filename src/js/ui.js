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
