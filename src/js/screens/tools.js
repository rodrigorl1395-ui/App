/*
  Ferramentas: objetos que ajudam de verdade — cada um entrega um conteúdo
  real (uma técnica, um roteiro, um checklist), não um número a mais.

  Duas origens, do mesmo jeito que o usuário pediu: algumas se compram com
  sementes (a mesma bolsa do Jardim), outras se encontram sozinhas quando o
  histórico de um hábito daquela categoria cumpre o requisito — como um
  achado de criatura, só que o prêmio é algo pra usar, não pra guardar.
*/

import { createEl, showToolFound } from "../ui.js";
import { createIcon } from "../icons.js";
import { refresh } from "../router.js";
import { getCompanionState } from "../companion.js";
import { CATEGORY_LABELS } from "../../data/animals.js";
import { getSeedsAvailable } from "../decor.js";
import { getShopCatalog, buyTool, getOwnedTools, getPendingTool, collectTool } from "../tools.js";

export function renderToolsScreen() {
  const pendente = getPendingTool();
  if (pendente) {
    const companion = getCompanionState(pendente.habit);
    // O achado se anuncia assim que a tela abre — igual a uma criatura
    // entregando algo no Lar, só que o conteúdo mora aqui, não lá.
    requestAnimationFrame(() => {
      showToolFound(pendente.tool, pendente.habit, companion.animal, () => {
        collectTool(pendente.tool.id, pendente.habit.id);
        refresh();
      });
    });
  }

  const owned = getOwnedTools();
  const seeds = getSeedsAvailable();
  const shop = getShopCatalog();

  return createEl("div", {
    className: "screen",
    children: [
      createEl("div", {
        className: "screen-header",
        children: [
          createEl("h1", { className: "section-title", text: "Ferramentas" }),
          createEl("a", { className: "link-button", text: "Voltar", attrs: { href: "#/hoje" } }),
        ],
      }),
      createEl("p", {
        className: "tree-hint",
        text: "Objetos que ajudam de verdade: cada um ensina algo pra usar, não só decora. Algumas se compram com sementes, outras se encontram cumprindo o hábito certo.",
      }),
      owned.length ? renderOwned(owned) : renderEmptyOwned(),
      renderShop(seeds, shop),
    ],
  });
}

function renderEmptyOwned() {
  return createEl("p", {
    className: "tree-hint",
    text: "Nenhuma ferramenta ainda. Compre uma na loja abaixo, ou cumpra um hábito com constância — algumas se encontram sozinhas.",
  });
}

function renderOwned(owned) {
  return createEl("div", {
    className: "tool-list",
    children: owned.map((item) => renderToolCard(item.tool)),
  });
}

function renderToolCard(tool) {
  return createEl("section", {
    className: "card tool-card",
    children: [
      createEl("div", {
        className: "tool-card-head",
        children: [
          createEl("span", { className: "tool-card-icon", children: [createIcon(tool.icon)] }),
          createEl("div", {
            className: "tool-card-title",
            children: [
              createEl("span", { className: "card-title", text: tool.name }),
              createEl("span", {
                className: "tool-card-category",
                text: `Cuida de ${CATEGORY_LABELS[tool.category] || tool.category}`,
              }),
            ],
          }),
        ],
      }),
      createEl("p", { className: "card-subtitle", text: tool.content.intro }),
      createEl("div", {
        className: "tool-content",
        children: tool.content.items.map((item) =>
          createEl("div", {
            className: "tool-content-item",
            children: [
              createEl("span", { className: "tool-content-title", text: item.titulo }),
              createEl("span", { className: "tool-content-text", text: item.texto }),
            ],
          })
        ),
      }),
    ],
  });
}

/*
  A loja: só as ferramentas compráveis (source "loja"). As de achado nunca
  aparecem aqui — elas não se compram, e listá-las como indisponíveis só
  cobraria uma dívida que não é bem assim que a app funciona.
*/
function renderShop(seeds, shop) {
  if (!shop.length) return null;

  return createEl("section", {
    className: "card garden-shop",
    children: [
      createEl("div", {
        className: "section-header",
        children: [
          createEl("h2", { className: "card-title", text: "Loja" }),
          createEl("span", { className: "badge", text: `${seeds} ${seeds === 1 ? "semente" : "sementes"}` }),
        ],
      }),
      createEl("p", {
        className: "card-subtitle",
        text: "A mesma bolsa de sementes do Jardim — gastar aqui é gastar de lá também.",
      }),
      createEl("div", { className: "garden-catalog", children: shop.map(renderShopItem) }),
    ],
  });
}

function renderShopItem(item) {
  const button = createEl("button", {
    className: "button button-secondary",
    text: item.obtained ? "Obtida" : item.affordable ? `Obter · ${item.cost}` : `${item.cost} sementes`,
    attrs: { type: "button" },
  });
  button.disabled = item.obtained || !item.affordable;
  button.addEventListener("click", () => {
    buyTool(item.id);
    refresh();
  });

  return createEl("article", {
    className: "garden-catalog-item",
    children: [
      createEl("div", {
        className: "tool-shop-icon",
        children: [createIcon(item.icon)],
      }),
      createEl("div", {
        className: "garden-catalog-body",
        children: [
          createEl("span", { className: "garden-catalog-name", text: item.name }),
          createEl("span", { className: "garden-catalog-story", text: item.story }),
        ],
      }),
      button,
    ],
  });
}
