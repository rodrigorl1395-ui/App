/*
  Jardim — o mundo.

  A tela inteira é o lugar: nada de cena numa caixinha com listas rolando
  embaixo. O que antes eram seções viraram fichas que sobem do rodapé
  quando você toca em alguma coisa do mundo, e dois botões flutuantes para
  o que se faz de fora (regar o que falta, plantar o que se comprou).

  Aqui moram as duas metades que antes eram telas separadas: as árvores dos
  hábitos (que murcham quando você some) e os guardiões que vivem delas.
*/

import { createEl, showSheet, showDiscovery, showCelebration, accentStyle } from "../ui.js";
import { createIcon } from "../icons.js";
import { createGuardianArt } from "../guardianArt.js";
import { navigate, refresh } from "../router.js";
import { createWorld } from "../world/scene.js";
import { getSceneCreatures } from "../garden.js";
import { getCatalog, getGarden, getSeedsAvailable, plantItem } from "../decor.js";
import { getHabitStats } from "../stats.js";
import { getTreeType, getTreeStageProgress } from "../../data/trees.js";
import { vigorAmount, describeVigor, getTreeVigor } from "../master.js";
import { getTreeMark, setTreeMark, TREE_MARK_OPTIONS } from "../treeMarks.js";
import { collectDiscovery } from "../discoveries.js";
import { getTouchLine } from "../dialogue.js";
import { isDoneToday, completeMission } from "../missions.js";
import { getCompanionState } from "../companion.js";
import { stageName } from "../evolution.js";

export function renderGardenScreen() {
  const creatures = getSceneCreatures();
  const catalog = getCatalog();

  const trees = creatures.map((creature) => ({
    habit: creature.tree.habit,
    stage: creature.tree.stage,
    vigorBruto: creature.tree.vigor,
    vigor: vigorAmount(creature.tree.vigor),
    leaf: getTreeType(creature.tree.habit.treeType).leaf,
    mark: getTreeMark(creature.tree.habit.id),
  }));

  const porId = new Map(catalog.map((item) => [item.id, item]));
  const decor = getGarden()
    .map((plantado) => ({ item: porId.get(plantado.itemId), plantedId: plantado.id }))
    .filter((plot) => plot.item)
    .map(({ item, plantedId }) => ({
      id: plantedId,
      name: item.name,
      story: item.story,
      kind: item.kind,
      color: item.color || "#c9a26a",
      scale: item.scale || 1,
    }));

  const bichos = creatures.map((creature) => ({
    habit: creature.habit,
    animal: creature.animal,
    color: creature.animal.color,
    dormindo: creature.activity.motion === "sleep",
    presente: Boolean(creature.pendingDiscovery),
    creature,
  }));

  const viewport = createEl("div", { className: "world-viewport" });

  // O mundo só é montado quando a caixa já existe no documento e tem
  // largura — antes disso a escala nasceria de zero.
  requestAnimationFrame(() => {
    if (!viewport.isConnected) return;
    createWorld(viewport, {
      trees,
      decor,
      creatures: bichos,
      onPick: (tipo, dados) => {
        if (tipo === "arvore") abrirArvore(dados);
        else if (tipo === "criatura") abrirCriatura(dados);
        else abrirEnfeite(dados);
      },
    });
  });

  return createEl("div", {
    className: "world-screen",
    children: [viewport, renderHud(creatures, trees.length)],
  });
}

/* ------------------------------------------------------------------ */
/* HUD                                                                 */
/* ------------------------------------------------------------------ */

function renderHud(creatures, quantasArvores) {
  const sementes = getSeedsAvailable();
  const regadas = creatures.filter((c) => c.done).length;
  const faltam = creatures.filter((c) => !c.done);

  const topo = createEl("div", {
    className: "world-topbar",
    children: [
      createEl("div", {
        className: "world-title",
        children: [
          createEl("h1", { className: "world-title-name", text: "Jardim" }),
          createEl("span", {
            className: "world-title-note",
            text: quantasArvores
              ? `${regadas} de ${quantasArvores} ${quantasArvores === 1 ? "árvore regada" : "árvores regadas"} hoje`
              : "Ainda sem árvores",
          }),
        ],
      }),
      createEl("span", {
        className: "world-chip",
        children: [
          createEl("span", { className: "world-chip-icon", children: [createIcon("coins")] }),
          createEl("span", { text: String(sementes) }),
        ],
      }),
    ],
  });

  const botaoPlantar = createEl("button", {
    className: "world-fab",
    attrs: { type: "button", "aria-label": "Plantar" },
    children: [createIcon("sprout"), createEl("span", { className: "world-fab-label", text: "Plantar" })],
  });
  botaoPlantar.addEventListener("click", abrirLoja);

  const acoes = [botaoPlantar];

  // "Regar" só existe quando há o que regar: um botão que não faz nada é
  // pior do que botão nenhum.
  if (faltam.length) {
    const botaoRegar = createEl("button", {
      className: "world-fab is-primary",
      attrs: { type: "button", "aria-label": "Regar" },
      children: [
        createIcon("droplet"),
        createEl("span", { className: "world-fab-label", text: `Regar (${faltam.length})` }),
      ],
    });
    botaoRegar.addEventListener("click", () => abrirRega(faltam));
    acoes.push(botaoRegar);
  }

  const vazio = !quantasArvores
    ? createEl("a", {
        className: "world-empty",
        attrs: { href: "#/novo-habito" },
        children: [
          createEl("span", { className: "world-empty-title", text: "O terreno está limpo." }),
          createEl("span", {
            className: "world-empty-text",
            text: "Cada hábito planta uma árvore aqui, e traz um guardião para cuidar dela.",
          }),
          createEl("span", { className: "button button-primary", text: "Plantar o primeiro hábito" }),
        ],
      })
    : null;

  return createEl("div", {
    className: "world-hud",
    children: [topo, vazio, createEl("div", { className: "world-actions", children: acoes })],
  });
}

/* ------------------------------------------------------------------ */
/* Fichas do mundo                                                     */
/* ------------------------------------------------------------------ */

function barra(rotulo, valor, classe) {
  return createEl("div", {
    className: "plot-bar",
    children: [
      createEl("span", { className: "plot-bar-label", text: rotulo }),
      createEl("span", {
        className: "plot-bar-track",
        children: [
          createEl("span", {
            className: `plot-bar-fill ${classe}`,
            attrs: { style: `width: ${Math.max(3, Math.round(valor))}%` },
          }),
        ],
      }),
      createEl("span", { className: "plot-bar-value", text: `${Math.round(valor)}%` }),
    ],
  });
}

/*
  A ficha da árvore. As três barras que antes moravam num cartão embaixo da
  cena vivem aqui: só fazem sentido quando você está perguntando sobre
  aquela árvore, e não como lista de todas ao mesmo tempo.
*/
function abrirArvore(dados) {
  const habit = dados.habit;
  const tipo = getTreeType(habit.treeType);
  const companion = getCompanionState(habit);
  const stats = getHabitStats(habit);
  const { stage, progress } = getTreeStageProgress(companion.habitXp);
  const vigorBruto = getTreeVigor(habit.id);
  const vigor = vigorAmount(vigorBruto);
  const feito = isDoneToday(habit.id);
  const maduro = stage.stage >= 6;

  const conteudo = [
    createEl("div", {
      className: "plot-bars",
      children: [
        barra("Água", vigor * 100, "is-agua"),
        barra("Sol", stats.consistency, "is-sol"),
        barra("Crescimento", progress * 100, "is-crescimento"),
      ],
    }),
    createEl("p", { className: "sheet-note", text: describeVigor(vigorBruto) }),
  ];

  showSheet({
    title: habit.name,
    subtitle: `${tipo.name} · ${stage.name}`,
    accent: companion.animal?.color,
    content: conteudo,
    actions: [
      feito
        ? null
        : {
            label: "Regar (cumprir hoje)",
            icon: "droplet",
            primary: true,
            onClick: () => cumprir(habit),
          },
      maduro
        ? { label: "Colher frutos", icon: "apple", keepOpen: true, onClick: colher }
        : null,
      { label: "Ver hábito", onClick: () => navigate(`/criatura?habit=${habit.id}`) },
      { label: "Marcar tronco", onClick: () => abrirMarcas(habit) },
    ],
  });
}

// Colher é só o gesto: as sementes continuam nascendo dos frutos guardados,
// sozinhas, como sempre foram. O que muda aqui é a satisfação, não o número.
function colher() {
  const fx = createEl("div", { className: "harvest-toast", text: "Você colheu os frutos maduros." });
  document.body.appendChild(fx);
  setTimeout(() => fx.remove(), 1600);
}

function abrirMarcas(habit) {
  const atual = getTreeMark(habit.id);
  showSheet({
    title: "Gravar uma marca",
    subtitle: `Fica na casca da árvore de ${habit.name} até você trocar ou apagar.`,
    content: [
      createEl("div", {
        className: "mark-grid",
        children: TREE_MARK_OPTIONS.map((opcao) => {
          const botao = createEl("button", {
            className: `mark-option${atual?.id === opcao.id ? " is-active" : ""}`,
            attrs: { type: "button", "aria-label": opcao.label },
            children: [createIcon(opcao.icon)],
          });
          botao.addEventListener("click", () => {
            setTreeMark(habit.id, atual?.id === opcao.id ? null : opcao.id);
            document.querySelector(".sheet-overlay")?.remove();
            refresh();
          });
          return botao;
        }),
      }),
    ],
    actions: [
      atual
        ? {
            label: "Apagar marca",
            onClick: () => {
              setTreeMark(habit.id, null);
              refresh();
            },
          }
        : null,
    ],
  });
}

/*
  O guardião. O que era o Lar inteiro cabe aqui: ele fala, ele entrega o
  que achou, e dali se vai para o perfil dele. A arte cheia aparece nesta
  ficha — no mundo ele é um bichinho de pixel, aqui é ele mesmo.
*/
function abrirCriatura(dados) {
  const { creature, animal, habit } = dados;

  if (creature.pendingDiscovery) {
    showDiscovery(creature.pendingDiscovery, animal, () => {
      collectDiscovery(creature.pendingDiscovery, habit);
      refresh();
    });
    return;
  }

  const companion = getCompanionState(habit);
  const feito = isDoneToday(habit.id);

  showSheet({
    title: animal.name,
    subtitle: `${stageName(companion.stage, animal.gender)} · cuida de ${habit.name}`,
    accent: animal.color,
    content: [
      createEl("div", {
        className: "sheet-portrait",
        children: [createEl("div", { className: "sheet-portrait-orb", children: [createGuardianArt(animal.id)] })],
      }),
      createEl("p", { className: "sheet-speech", text: `"${getTouchLine(animal)}"` }),
      createEl("p", { className: "sheet-note", text: creature.mood.label }),
    ],
    actions: [
      feito ? null : { label: "Regar a árvore dele", icon: "droplet", primary: true, onClick: () => cumprir(habit) },
      { label: "Ver perfil", onClick: () => navigate(`/criatura?habit=${habit.id}`) },
    ],
  });
}

function abrirEnfeite(dados) {
  showSheet({
    title: dados.name,
    subtitle: dados.kind === "morada" ? "Morada" : "Árvore de enfeite",
    content: [createEl("p", { className: "sheet-speech", text: `"${dados.story}"` })],
    actions: [{ label: "Fechar", onClick: () => {} }],
  });
}

/* ------------------------------------------------------------------ */
/* Ações de fora do mundo                                              */
/* ------------------------------------------------------------------ */

/*
  Regar de dentro do mundo: o que falta hoje, em uma lista, cada um com um
  toque só. É o mesmo completeMission da tela Hoje — nada aqui é atalho que
  fabrica dia cumprido, é o mesmo registro.
*/
function abrirRega(faltam) {
  showSheet({
    title: "O que falta regar hoje",
    subtitle: "Cumprir o hábito é a água. Um toque registra a missão principal.",
    content: [
      createEl("div", {
        className: "water-list",
        children: faltam.map((creature) => {
          const botao = createEl("button", {
            className: "water-row",
            attrs: { type: "button", style: accentStyle(creature.animal.color) },
            children: [
              createEl("span", {
                className: "water-row-orb",
                children: [createGuardianArt(creature.animal.id)],
              }),
              createEl("span", {
                className: "water-row-body",
                children: [
                  createEl("span", { className: "water-row-name", text: creature.habit.name }),
                  createEl("span", {
                    className: "water-row-note",
                    text: `${creature.habit.missions.main} ${creature.habit.unit} · ${creature.animal.name} espera`,
                  }),
                ],
              }),
              createEl("span", { className: "water-row-action", children: [createIcon("droplet")] }),
            ],
          });
          botao.addEventListener("click", () => {
            document.querySelector(".sheet-overlay")?.remove();
            cumprir(creature.habit);
          });
          return botao;
        }),
      }),
    ],
  });
}

function cumprir(habit) {
  const companion = getCompanionState(habit);
  const resultado = completeMission(habit, "main");
  showCelebration(
    {
      xpEarned: resultado.xpEarned,
      message: `${habit.name} — regado hoje.`,
      note: companion.animal ? `${companion.animal.name} comeu dos frutos.` : null,
      evolutionText: resultado.evolved && companion.animal ? `${companion.animal.name} evoluiu.` : null,
      animal: companion.animal,
    },
    refresh
  );
}

function abrirLoja() {
  const sementes = getSeedsAvailable();
  const catalogo = getCatalog();

  showSheet({
    title: "Plantar no jardim",
    subtitle: `${sementes} ${sementes === 1 ? "semente" : "sementes"} · vêm de frutos guardados e sequências longas.`,
    content: [
      createEl("div", {
        className: "shop-list",
        children: catalogo.map((item) => {
          const botao = createEl("button", {
            className: "button button-secondary shop-buy",
            text: item.affordable ? `Plantar · ${item.cost}` : `${item.cost}`,
            attrs: { type: "button" },
          });
          botao.disabled = !item.affordable;
          botao.addEventListener("click", () => {
            plantItem(item.id);
            document.querySelector(".sheet-overlay")?.remove();
            refresh();
          });

          return createEl("article", {
            className: "shop-row",
            children: [
              createEl("span", {
                className: "shop-row-icon",
                children: [createIcon(item.kind === "morada" ? "tools" : "tree")],
              }),
              createEl("div", {
                className: "shop-row-body",
                children: [
                  createEl("span", { className: "shop-row-name", text: item.name }),
                  createEl("span", { className: "shop-row-story", text: item.story }),
                  item.ownedCount
                    ? createEl("span", { className: "shop-row-owned", text: `${item.ownedCount} no jardim` })
                    : null,
                ],
              }),
              botao,
            ],
          });
        }),
      }),
    ],
  });
}

// Quem chega em #/lar (link antigo, atalho salvo na tela inicial) cai no
// mesmo lugar: o Lar virou este jardim.
export const renderHomeScreen = renderGardenScreen;
