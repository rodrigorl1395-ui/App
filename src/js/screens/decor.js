/*
  Jardim: onde vivem as árvores.

  A árvore de cada hábito mora aqui, não no Lar — é ela que murcha se você
  sumir e fica de pé quando você volta. O guardião mora ao lado, no Lar, e
  cuida dela de longe; a comida que ela dá ainda é dele, só a planta que é
  daqui. Por cima disso, o que se planta com sementes: moradas e árvores só
  de enfeite, sem ligação com hábito nenhum.
*/

import { createEl, createSectionHeader, createScenePortal } from "../ui.js";
import { createTree, createIcon } from "../icons.js";
import { createIsoDwelling } from "../isoBuildings.js";
import { refresh } from "../router.js";
import { getSceneCreatures, getTreePosition, getDecorPosition } from "../garden.js";
import { getCatalog, getGarden, getSeedsAvailable, plantItem } from "../decor.js";
import { getHabits } from "../habits.js";
import { getCompanionState } from "../companion.js";
import { getElement } from "../../data/animals.js";
import { getTreeType } from "../../data/trees.js";
import { vigorAmount } from "../master.js";

export function renderGardenScreen() {
  const seeds = getSeedsAvailable();
  const catalog = getCatalog();

  return createEl("div", {
    className: "screen",
    children: [
      createSectionHeader("Jardim"),
      createEl("p", {
        className: "tree-hint",
        text: "A árvore de cada guardião mora aqui — é nela que o hábito cumprido vira água. O que você planta com sementes é só enfeite, ao lado.",
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
  A cena: as árvores de verdade primeiro (cada uma com a vigor dela, murcha
  ou de pé — o único medidor da cena), o que foi plantado com sementes por
  cima. A porta de volta ao Lar fica sempre na borda esquerda, plantado ou
  não, porque a travessia não devia depender de ter algo para mostrar.
*/
function renderScene(catalog) {
  const trees = getSceneCreatures().map((creature) => creature.tree);
  // Cada morada usa o id do próprio registro plantado como semente, não o id
  // do catálogo — assim duas cabanas compradas viram duas casas diferentes,
  // e cada uma mantém a mesma forma para sempre, mesmo depois de recarregar.
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const plots = getGarden()
    .map((planted) => ({ item: byId.get(planted.itemId), plantedId: planted.id }))
    .filter((plot) => plot.item);

  const scene = createEl("div", { className: "home-scene garden-scene" });
  scene.appendChild(createEl("div", { className: "home-ground" }));
  scene.appendChild(
    createScenePortal({ href: "#/lar", label: "Lar", side: "left", icon: firstGuardianIcon() })
  );

  trees.forEach((item, index) => {
    const treeType = getTreeType(item.habit.treeType);
    const position = getTreePosition(index, trees.length);
    const vigor = vigorAmount(item.vigor);
    scene.appendChild(
      createEl("div", {
        className: `home-tree${vigor < 0.5 ? " is-murcha" : ""}`,
        attrs: {
          style: `left: ${position.x}%; top: ${position.y}%; --tree-scale: ${
            0.75 + item.stage.stage * 0.14
          }`,
          title: `${item.habit.name} — ${treeType.name}, ${item.stage.name}`,
        },
        children: [createTree(item.stage.stage, treeType.leaf, vigor)],
      })
    );
  });

  if (!plots.length && !trees.length) {
    scene.appendChild(
      createEl("p", { className: "garden-scene-hint", text: "Ainda não há nada plantado aqui." })
    );
    return scene;
  }

  plots.forEach(({ item, plantedId }, index) => {
    const position = getDecorPosition(index, plots.length);
    const isBuilding = item.kind === "morada";
    scene.appendChild(
      createEl("div", {
        className: `home-decor${isBuilding ? " is-building" : ""}`,
        attrs: {
          style: `left: ${position.x}%; top: ${position.y}%; --decor-scale: ${
            isBuilding ? item.scale : 0.9
          }`,
          title: item.name,
        },
        children: [
          isBuilding ? createIsoDwelling(plantedId, item.build) : createTree(4, item.color, 1),
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
  const isBuilding = item.kind === "morada";
  const preview = isBuilding ? createIsoDwelling(item.id, item.build) : createTree(4, item.color, 1);

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
      createEl("div", {
        className: `garden-catalog-preview${isBuilding ? " is-building" : ""}`,
        children: [preview],
      }),
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
