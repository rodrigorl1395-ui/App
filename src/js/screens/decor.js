/*
  Jardim: onde as sementes viram moradas e árvores de enfeite.

  Separado do Lar de propósito — lá é onde os guardiões vivem livres e comem
  da própria árvore; aqui é só o que você planta por cima disso, sem nenhum
  guardião morando. Duas cenas, dois motivos de visitar.
*/

import { createEl, createSectionHeader, createEmptyState } from "../ui.js";
import { createDwelling, createTree } from "../icons.js";
import { refresh } from "../router.js";
import { getDecorPosition } from "../garden.js";
import { getCatalog, getSeedsAvailable, plantItem } from "../decor.js";

export function renderGardenScreen() {
  const seeds = getSeedsAvailable();
  const catalog = getCatalog();

  return createEl("div", {
    className: "screen",
    children: [
      createSectionHeader("Jardim"),
      createEl("p", {
        className: "tree-hint",
        text: "Aqui não mora nenhum guardião — só o que você planta com as sementes que eles trazem. Enfeite puro: nada disto mexe no seu progresso.",
      }),
      renderScene(catalog),
      renderShop(seeds, catalog),
    ],
  });
}

// A cena: só o que já foi plantado, espalhado do mesmo jeito que no Lar —
// mesma receita visual, mas sem nenhum guardião andando por ela.
function renderScene(catalog) {
  const planted = catalog.filter((item) => item.ownedCount > 0);
  const plots = planted.flatMap((item) => Array(item.ownedCount).fill(item));

  if (!plots.length) {
    return createEmptyState(
      "Seu jardim está vazio. Plante o primeiro item com as sementes que já tiver."
    );
  }

  const scene = createEl("div", { className: "home-scene garden-scene" });
  scene.appendChild(createEl("div", { className: "home-ground" }));

  plots.forEach((item, index) => {
    const position = getDecorPosition(index, plots.length);
    scene.appendChild(
      createEl("div", {
        className: "home-decor",
        attrs: {
          style: `left: ${position.x}%; top: ${position.y}%; --decor-scale: ${
            item.kind === "morada" ? item.scale : 0.9
          }`,
          title: item.name,
        },
        children: [
          item.kind === "morada" ? createDwelling(item.color, item.scale) : createTree(4, item.color, 1),
        ],
      })
    );
  });

  return scene;
}

/*
  A loja: sementes vêm de frutos guardados e de sequências longas — nunca de
  abrir o app ou cumprir uma missão qualquer — e trocam por moradas e
  árvores só de enfeite. Nada aqui dá XP, mexe em vigor ou desbloqueio.
*/
function renderShop(seeds, catalog) {
  return createEl("section", {
    className: "card garden-shop",
    children: [
      createEl("div", {
        className: "section-header",
        children: [
          createEl("h2", { className: "card-title", text: "O que plantar" }),
          createEl("span", { className: "badge", text: `${seeds} ${seeds === 1 ? "semente" : "sementes"}` }),
        ],
      }),
      createEl("p", {
        className: "card-subtitle",
        text: "Sementes vêm de frutos guardados e de sequências longas.",
      }),
      createEl("div", { className: "garden-catalog", children: catalog.map(renderCatalogItem) }),
    ],
  });
}

function renderCatalogItem(item) {
  const preview = item.kind === "morada" ? createDwelling(item.color, item.scale) : createTree(4, item.color, 1);

  const button = createEl("button", {
    className: "button button-secondary",
    text: item.affordable ? `Plantar · ${item.cost}` : `${item.cost} sementes`,
    attrs: { type: "button" },
  });
  button.disabled = !item.affordable;
  button.addEventListener("click", () => {
    plantItem(item.id);
    refresh();
  });

  return createEl("article", {
    className: "garden-catalog-item",
    children: [
      createEl("div", { className: "garden-catalog-preview", children: [preview] }),
      createEl("div", {
        className: "garden-catalog-body",
        children: [
          createEl("span", { className: "garden-catalog-name", text: item.name }),
          createEl("span", { className: "garden-catalog-story", text: item.story }),
          item.ownedCount
            ? createEl("span", { className: "fruit-date", text: `${item.ownedCount} no jardim` })
            : null,
        ],
      }),
      button,
    ],
  });
}
