/*
  Jardim: onde vivem as árvores.

  A árvore de cada hábito mora aqui, não no Lar — é ela que murcha se você
  sumir e fica de pé quando você volta. O guardião mora ao lado, no Lar, e
  cuida dela de longe; a comida que ela dá ainda é dele, só a planta que é
  daqui. Por cima disso, o que se planta com sementes: moradas e árvores só
  de enfeite, sem ligação com hábito nenhum.
*/

import { createEl, createSectionHeader } from "../ui.js";
import { createTree, createIcon } from "../icons.js";
import { createIsoDwelling } from "../isoBuildings.js";
import { createGardenScene } from "../gardenScene.js";
import { navigate, refresh } from "../router.js";
import { getSceneCreatures } from "../garden.js";
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
  A cena: as árvores de verdade primeiro (cada uma com o vigor dela, murcha
  ou de pé), o que foi plantado com sementes por cima, em pixel art — sem
  WebGL, sem contexto para descartar. A porta de volta ao Lar fica sempre na
  borda esquerda, plantado ou não, porque a travessia não devia depender de
  ter algo para mostrar.

  O vigor cru vira número aqui para desenhar a árvore (uma árvore nunca
  regada não está murcha, só ainda não foi regada uma vez), mas o número
  bruto segue junto — é ele que describeVigor usa para escrever a frase
  certa na fichinha de cada árvore.
*/
function renderScene(catalog) {
  const trees = getSceneCreatures().map((creature) => ({
    habit: creature.tree.habit,
    stage: creature.tree.stage,
    vigorBruto: creature.tree.vigor,
    vigor: vigorAmount(creature.tree.vigor),
    leaf: getTreeType(creature.tree.habit.treeType).leaf,
  }));

  const byId = new Map(catalog.map((item) => [item.id, item]));
  const decor = getGarden()
    .map((planted) => ({ item: byId.get(planted.itemId), plantedId: planted.id }))
    .filter((plot) => plot.item)
    .map(({ item, plantedId }) => ({
      id: plantedId,
      name: item.name,
      kind: item.kind,
      color: item.color || "#c9a26a",
      scale: item.scale || 1,
    }));

  return createGardenScene(trees, decor, {
    onNavigate: (habitId) => navigate(`/criatura?habit=${habitId}`),
    onChanged: refresh,
    firstGuardianIcon: firstGuardianIcon(),
  });
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
