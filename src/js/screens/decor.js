/*
  Jardim: onde as sementes viram moradas e árvores de enfeite.

  Separado do Lar de propósito — lá é onde os guardiões vivem livres e comem
  da própria árvore; aqui é só o que você planta por cima disso, sem nenhum
  guardião morando. Duas cenas, dois motivos de visitar.
*/

import { createEl, createSectionHeader, createScenePortal } from "../ui.js";
import { createDwelling, createTree, createIcon } from "../icons.js";
import { refresh } from "../router.js";
import { getDecorPosition } from "../garden.js";
import { getCatalog, getSeedsAvailable, plantItem } from "../decor.js";
import { getHabits } from "../habits.js";
import { getCompanionState } from "../companion.js";
import { getElement } from "../../data/animals.js";

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

// O ícone de quem está esperando do outro lado da porta: o elemento do
// primeiro guardião, se já houver algum. É o que faz a travessia parecer
// "ir visitar", e não abrir uma tela qualquer.
function firstGuardianIcon() {
  const habit = getHabits()[0];
  const animal = habit ? getCompanionState(habit).animal : null;
  return createIcon(animal ? getElement(animal.element).icon : "leaf");
}

/*
  A cena: o mesmo terreno do Lar, com a porta de volta na borda esquerda —
  sempre presente, plantado ou não, porque a travessia não depende de ter
  algo para mostrar. Só o que está plantado muda; a porta, não.
*/
function renderScene(catalog) {
  const planted = catalog.filter((item) => item.ownedCount > 0);
  const plots = planted.flatMap((item) => Array(item.ownedCount).fill(item));

  const scene = createEl("div", { className: "home-scene garden-scene" });
  scene.appendChild(createEl("div", { className: "home-ground" }));
  scene.appendChild(
    createScenePortal({ href: "#/lar", label: "Lar", side: "left", icon: firstGuardianIcon() })
  );

  if (!plots.length) {
    scene.appendChild(
      createEl("p", {
        className: "garden-scene-hint",
        text: "Ainda não há nada plantado aqui.",
      })
    );
    return scene;
  }

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
