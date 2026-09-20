/*
  Jardim: onde vivem as árvores.

  A árvore de cada hábito mora aqui, não no Lar — é ela que murcha se você
  sumir e fica de pé quando você volta. O guardião mora ao lado, no Lar, e
  cuida dela de longe; a comida que ela dá ainda é dele, só a planta que é
  daqui. Por cima disso, o que se planta com sementes: moradas e árvores só
  de enfeite, sem ligação com hábito nenhum.
*/

import { createEl, createSectionHeader, createScenePortal } from "../ui.js";
import { createTree, createIcon, createGardenBed } from "../icons.js";
import { createIsoDwelling } from "../isoBuildings.js";
import { refresh } from "../router.js";
import { getSceneCreatures, getPlotPosition, getDecorPosition } from "../garden.js";
import { getCatalog, getGarden, getSeedsAvailable, plantItem } from "../decor.js";
import { getHabits } from "../habits.js";
import { getCompanionState } from "../companion.js";
import { getHabitStats } from "../stats.js";
import { getElement } from "../../data/animals.js";
import { getTreeType, getTreeStageProgress } from "../../data/trees.js";
import { vigorAmount, describeVigor, getTreeVigor } from "../master.js";

export function renderGardenScreen() {
  const seeds = getSeedsAvailable();
  const catalog = getCatalog();
  const habits = getHabits();

  return createEl("div", {
    className: "screen",
    children: [
      createSectionHeader("Jardim"),
      createEl("p", {
        className: "tree-hint",
        text: "Cada hábito tem o seu canteiro. Cumprir o hábito é a água — o que você planta com sementes é só enfeite, ao lado.",
      }),
      renderScene(catalog),
      habits.length ? renderPlotCards(habits) : null,
      renderShop(seeds, catalog),
    ],
  });
}

/*
  A ficha de cada canteiro: as três barras que a cena não tem espaço para
  mostrar legível. Todas saem do histórico, nenhuma é enfeite —

    Água        vigor, que cai com os dias sem regar
    Sol         consistência, a fatia de dias combinados que você cumpriu
    Crescimento quanto falta de XP daquele hábito para o próximo estágio

  Não existe uma quarta barra porque não existe um quarto número real.
*/
function renderPlotCards(habits) {
  return createEl("section", {
    className: "card garden-plots",
    children: [
      createEl("div", {
        className: "section-header",
        children: [
          createEl("h2", { className: "card-title", text: "Seus canteiros" }),
          createEl("span", {
            className: "badge",
            text: `${habits.length} ${habits.length === 1 ? "árvore" : "árvores"}`,
          }),
        ],
      }),
      ...habits.map(renderPlotCard),
    ],
  });
}

function renderPlotCard(habit) {
  const companion = getCompanionState(habit);
  const stats = getHabitStats(habit);
  const tree = getTreeType(habit.treeType);
  const { stage, next, progress } = getTreeStageProgress(companion.habitXp);
  const vigorBruto = getTreeVigor(habit.id);
  const vigor = vigorAmount(vigorBruto);

  const barras = [
    { rotulo: "Água", valor: Math.round(vigor * 100), classe: "is-agua" },
    { rotulo: "Sol", valor: Math.round(stats.consistency), classe: "is-sol" },
    { rotulo: "Crescimento", valor: Math.round(progress * 100), classe: "is-crescimento" },
  ];

  return createEl("a", {
    className: "plot-card",
    attrs: { href: `#/criatura?habit=${habit.id}` },
    children: [
      createEl("span", {
        className: `plot-card-art${vigor < 0.5 ? " is-murcha" : ""}`,
        children: [createTree(stage.stage, tree.leaf, vigor)],
      }),
      createEl("div", {
        className: "plot-card-body",
        children: [
          createEl("span", { className: "plot-card-name", text: habit.name }),
          createEl("span", {
            className: "plot-card-stage",
            text: next ? `${tree.name} · ${stage.name}` : `${tree.name} · ${stage.name}, no topo`,
          }),
          createEl("div", {
            className: "plot-bars",
            children: barras.map((barra) =>
              createEl("div", {
                className: "plot-bar",
                children: [
                  createEl("span", { className: "plot-bar-label", text: barra.rotulo }),
                  createEl("span", {
                    className: "plot-bar-track",
                    children: [
                      createEl("span", {
                        className: `plot-bar-fill ${barra.classe}`,
                        attrs: { style: `width: ${Math.max(2, barra.valor)}%` },
                      }),
                    ],
                  }),
                  createEl("span", { className: "plot-bar-value", text: `${barra.valor}%` }),
                ],
              })
            ),
          }),
          createEl("span", { className: "plot-card-note", text: describeVigor(vigorBruto) }),
        ],
      }),
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

  /*
    Cada árvore num canteiro seu, com a placa do nome do hábito. A placa é o
    que faltava: antes dava para ver que havia árvores, mas não qual era de
    qual hábito — e o nome só existia como title, que no celular ninguém vê.
  */
  trees.forEach((item, index) => {
    const treeType = getTreeType(item.habit.treeType);
    const position = getPlotPosition(index, trees.length);
    const vigor = vigorAmount(item.vigor);

    scene.appendChild(
      createEl("div", {
        className: "garden-plot",
        attrs: {
          style: `left: ${position.x}%; top: ${position.y}%; --plot-scale: ${position.scale.toFixed(2)}`,
          title: `${item.habit.name} — ${treeType.name}, ${item.stage.name}`,
        },
        children: [
          createEl("span", { className: "garden-plot-bed", children: [createGardenBed()] }),
          createEl("span", {
            className: `garden-plot-tree${vigor < 0.5 ? " is-murcha" : ""}`,
            attrs: { style: `--tree-scale: ${(0.75 + item.stage.stage * 0.14).toFixed(2)}` },
            children: [createTree(item.stage.stage, treeType.leaf, vigor)],
          }),
          createEl("span", { className: "garden-plot-sign", text: item.habit.name }),
        ],
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
